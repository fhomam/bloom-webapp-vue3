/**
 * useBloomUrlState
 * ----------------
 * Centralized read/write access to the Bloom report's URL-driven state.
 *
 * See: docs/bloom-report-url-state.md for the full contract.
 *
 * Three URL params govern the Bloom report:
 *   - taxo:    selection scope, format L1:L2:L3 (independent of panel)
 *   - panel:   'taxonomy' | 'interactions' | (absent = closed)
 *   - emotion: filter+highlight for the interactions panel
 *   - hl:      'issue' to highlight issue bits inside interactions
 *
 * All components should use this composable rather than touching route.query
 * directly or mutating ui.isRightOpen / ui.activeRightTab.
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const VALID_PANELS = ['taxonomy', 'interactions']
const VALID_EMOTIONS = ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']
const VALID_HL = ['issue']

/**
 * Normalize a taxo value read from the URL.
 *
 * Colons in query-string values are RFC-3986-legal and pass through browsers
 * and vue-router unchanged, so the canonical form is colon-delimited:
 *   `account-access:sign-in:login-fails`
 *
 * Some legacy in-the-wild URLs use dash-as-delimiter (`account-access-sign-in-login-fails`)
 * from the older encoding scheme. We can't unambiguously decode those because
 * taxonomy segments themselves may contain hyphens, but we accept them as-is
 * if they happen to land here — issue.taxo comparisons elsewhere should match
 * on prefix, which still works for the legacy form.
 *
 * Going forward, write colon-delimited only.
 */
const normalizeTaxo = (raw) => {
  if (!raw) return null
  return String(raw)
}

export function useBloomUrlState() {
  const route = useRoute()
  const router = useRouter()

  // ---- Reactive reads ----
  const taxo = computed(() => normalizeTaxo(route.query.taxo))

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
   * True when taxo points at a specific issue (three segments).
   * Useful for deciding whether issue-bits highlight is meaningful,
   * or whether the in-panel emotion chips should be shown.
   */
  const isIssueLevel = computed(() => {
    if (!taxo.value) return false
    return taxo.value.split(':').length >= 3
  })

  // ---- Internal pusher with no-op guard ----
  // Accepts an updater that mutates a draft query object. If no change,
  // doesn't push (avoids polluting history with redundant entries).
  const updateQuery = (mutate) => {
    const current = { ...route.query }
    const draft = { ...current }
    mutate(draft)

    // Normalize: strip null/undefined/empty keys
    Object.keys(draft).forEach((k) => {
      if (draft[k] === null || draft[k] === undefined || draft[k] === '') {
        delete draft[k]
      }
    })

    // Compare shallow — only push if something changed
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
  const setTaxo = (newTaxo) => {
    updateQuery((q) => {
      q.taxo = newTaxo ? String(newTaxo) : null
    })
  }

  const setPanel = (newPanel) => {
    updateQuery((q) => {
      if (newPanel && !VALID_PANELS.includes(newPanel)) return
      q.panel = newPanel
      // When the panel closes or switches away from interactions, strip
      // the interactions-only modifiers so they don't linger in the URL.
      if (newPanel !== 'interactions') {
        delete q.emotion
        delete q.hl
      }
    })
  }

  const setEmotion = (metric) => {
    updateQuery((q) => {
      if (metric && !VALID_EMOTIONS.includes(metric)) return
      q.emotion = metric
      // emotion and hl are mutually exclusive — setting emotion clears hl
      if (metric) delete q.hl
    })
  }

  const setHl = (mode) => {
    updateQuery((q) => {
      if (mode && !VALID_HL.includes(mode)) return
      q.hl = mode
      // emotion and hl are mutually exclusive — setting hl clears emotion
      if (mode) delete q.emotion
    })
  }

  // ---- Composed helpers (the common patterns) ----

  /** Close the sidebar. Preserves taxo (selection survives panel close). */
  const closePanel = () => {
    updateQuery((q) => {
      delete q.panel
      delete q.emotion
      delete q.hl
    })
  }

  /**
   * "Show me the interactions for this issue." Called from packet cards.
   * Preserves any existing emotion/hl modifiers — the user may have set one.
   */
  const openInteractionsForIssue = (issueTaxo) => {
    updateQuery((q) => {
      q.taxo = issueTaxo ? String(issueTaxo) : null
      q.panel = 'interactions'
    })
  }

  /**
   * "Show me all interactions across the report tagged with this emotion."
   * Called from the ribbon emojis. Clears taxo — this is a zoom-out action.
   */
  const openInteractionsForEmotion = (metric) => {
    if (!VALID_EMOTIONS.includes(metric)) return
    updateQuery((q) => {
      delete q.taxo
      delete q.hl
      q.panel = 'interactions'
      q.emotion = metric
    })
  }

  /**
   * "Show me this node in the taxonomy tree." Called from breadcrumbs.
   */
  const openTaxonomyWith = (newTaxo) => {
    updateQuery((q) => {
      q.taxo = newTaxo ? String(newTaxo) : null
      q.panel = 'taxonomy'
      delete q.emotion
      delete q.hl
    })
  }

  return {
    // reads
    taxo,
    panel,
    emotion,
    hl,
    isIssueLevel,
    // setters
    setTaxo,
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