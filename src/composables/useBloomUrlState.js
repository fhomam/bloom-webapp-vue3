/**
 * useBloomUrlState
 * ----------------
 * Centralized read/write access to the Bloom report's URL-driven state.
 *
 * See: docs/bloom-report-url-state.md for the full contract.
 *
 * URL params governing the Bloom report:
 *   - taxo:     selection scope for the main report list (cards)
 *   - forIssue: issue-level scope for the interactions panel ONLY —
 *               doesn't filter the main list
 *   - panel:    'taxonomy' | 'interactions' | (absent = closed)
 *   - emotion:  filter+highlight for the interactions panel (single metric)
 *   - hl:       'issue' | 'emotion' — highlight mode for the interactions panel
 *
 * emotion and hl are mutually exclusive — they're alternative
 * highlight-mode selections. Setting one clears the other.
 *
 * All components should use this composable rather than touching
 * route.query directly or mutating ui.isRightOpen / ui.activeRightTab.
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const VALID_PANELS = ['taxonomy', 'interactions']
const VALID_EMOTIONS = ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']
const VALID_HL = ['issue', 'emotion']

/**
 * Normalize a taxo value read from the URL. Colons are RFC-3986-legal
 * in query string values, so the canonical form is colon-delimited:
 *   `account_access:sign_in:login_fails`
 */
const normalizeTaxo = (raw) => {
  if (!raw) return null
  return String(raw)
}

const isIssueLevelTaxo = (t) => Boolean(t) && t.split(':').length >= 3

export function useBloomUrlState() {
  const route = useRoute()
  const router = useRouter()

  // ---- Reactive reads ----
  const taxo = computed(() => normalizeTaxo(route.query.taxo))

  // forIssue is the panel's issue-scope, set independently of the
  // main list's taxo filter. Validated to be issue-level (L1:L2:L3) —
  // shallower values are ignored on read since they don't make sense
  // as a panel scope (there's no specific issue context to derive
  // issue-bits from).
  const forIssue = computed(() => {
    const raw = normalizeTaxo(route.query.forIssue)
    return isIssueLevelTaxo(raw) ? raw : null
  })

  const panel = computed(() => {
    const p = route.query.panel
    return VALID_PANELS.includes(p) ? p : null
  })

  const emotion = computed(() => {
    const e = route.query.emotion
    return VALID_EMOTIONS.includes(e) ? e : null
  })

  const hl = computed(() => {
    const h = route.query.hl
    return VALID_HL.includes(h) ? h : null
  })

  /**
   * The taxo the interactions panel is currently scoped to, applying
   * precedence: forIssue (if set) wins over taxo. This is what the
   * panel uses to build its interaction list and resolve titles.
   */
  const panelScopeTaxo = computed(() => forIssue.value || taxo.value)

  /**
   * The depth of panelScopeTaxo: 'category' | 'topic' | 'issue' | null.
   * Useful for deciding which affordances make sense in the panel.
   */
  const panelScopeDepth = computed(() => {
    const t = panelScopeTaxo.value
    if (!t) return null
    const len = t.split(':').length
    if (len === 1) return 'category'
    if (len === 2) return 'topic'
    if (len >= 3) return 'issue'
    return null
  })

  /**
   * True when the panel scope is issue-level (either via forIssue or
   * via taxo at L1:L2:L3). Used to gate hl=issue mode and the issue
   * highlight button.
   */
  const panelIsIssueScoped = computed(() => panelScopeDepth.value === 'issue')

  // ---- Internal pusher with no-op guard ----
  const updateQuery = (mutate) => {
    const current = { ...route.query }
    const draft = { ...current }
    mutate(draft)

    Object.keys(draft).forEach((k) => {
      if (draft[k] === null || draft[k] === undefined || draft[k] === '') {
        delete draft[k]
      }
    })

    const currentKeys = Object.keys(current)
    const draftKeys = Object.keys(draft)
    const changed =
      currentKeys.length !== draftKeys.length ||
      draftKeys.some((k) => draft[k] !== current[k])

    if (changed) {
      router.push({ query: draft })
    }
  }

  // ---- Setters ----

  /**
   * Set the main-list taxo filter. Any explicit taxo change is the
   * user's intent to refocus the main view, so forIssue is cleared
   * (a previous "panel-scope-only" peek is no longer relevant).
   */
  const setTaxo = (newTaxo) => {
    updateQuery((q) => {
      q.taxo = newTaxo ? String(newTaxo) : null
      delete q.forIssue
    })
  }

  /**
   * Set the panel's issue-scope without changing the main list.
   * Validates that the value is issue-level (L1:L2:L3). Shallower
   * values are silently dropped — caller should use setTaxo instead.
   */
  const setForIssue = (issueTaxo) => {
    updateQuery((q) => {
      if (issueTaxo && !isIssueLevelTaxo(String(issueTaxo))) return
      q.forIssue = issueTaxo ? String(issueTaxo) : null
    })
  }

  const setPanel = (newPanel) => {
    updateQuery((q) => {
      if (newPanel && !VALID_PANELS.includes(newPanel)) return
      q.panel = newPanel
      // Closing the panel or switching to taxonomy strips
      // interactions-only modifiers.
      if (newPanel !== 'interactions') {
        delete q.emotion
        delete q.hl
        delete q.forIssue
      }
    })
  }

  const setEmotion = (metric) => {
    updateQuery((q) => {
      if (metric && !VALID_EMOTIONS.includes(metric)) return
      q.emotion = metric
      // Mutual exclusion: a specific emotion filter clears hl.
      if (metric) delete q.hl
    })
  }

  const setHl = (mode) => {
    updateQuery((q) => {
      if (mode && !VALID_HL.includes(mode)) return
      q.hl = mode
      // Mutual exclusion: setting hl clears emotion.
      if (mode) delete q.emotion
    })
  }

  // ---- Composed helpers (the common entry points) ----

  /** Close the sidebar. Preserves taxo. */
  const closePanel = () => {
    updateQuery((q) => {
      delete q.panel
      delete q.emotion
      delete q.hl
      delete q.forIssue
    })
  }

  /**
   * "Show me this issue's interactions in the panel — without
   * filtering the main list." Called from packet cards' Reviews
   * button. Sets forIssue (NOT taxo), opens the panel, and defaults
   * to hl=issue so the AI's evidence is highlighted on entry.
   */
  const openInteractionsForIssue = (issueTaxo) => {
    if (!isIssueLevelTaxo(String(issueTaxo))) return
    updateQuery((q) => {
      q.forIssue = String(issueTaxo)
      q.panel = 'interactions'
      q.hl = 'issue'
      delete q.emotion
    })
  }

  /**
   * "Show me all interactions across the report tagged with this
   * emotion." Called from the ribbon emojis. Clears taxo AND
   * forIssue — this is a zoom-out action.
   */
  const openInteractionsForEmotion = (metric) => {
    if (!VALID_EMOTIONS.includes(metric)) return
    updateQuery((q) => {
      delete q.taxo
      delete q.forIssue
      delete q.hl
      q.panel = 'interactions'
      q.emotion = metric
    })
  }

  /**
   * "Show me this node in the taxonomy tree." Called from breadcrumbs.
   * Sets taxo (filters main list); clears panel modifiers.
   */
  const openTaxonomyWith = (newTaxo) => {
    updateQuery((q) => {
      q.taxo = newTaxo ? String(newTaxo) : null
      q.panel = 'taxonomy'
      delete q.emotion
      delete q.hl
      delete q.forIssue
    })
  }

  return {
    // reads
    taxo,
    forIssue,
    panel,
    emotion,
    hl,
    panelScopeTaxo,
    panelScopeDepth,
    panelIsIssueScoped,
    // setters
    setTaxo,
    setForIssue,
    setPanel,
    setEmotion,
    setHl,
    // composed
    closePanel,
    openInteractionsForIssue,
    openInteractionsForEmotion,
    openTaxonomyWith,
  }
}