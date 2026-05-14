<template>
  <div class="flex flex-col h-full w-full bg-white relative">
    
    <div class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
      <div class="flex flex-col min-w-0">
        <h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Interaction Explorer
        </h2>
        <div class="flex items-start gap-2">
          <span v-if="urlState.emotion.value" class="text-xl leading-none">
            {{ getEmoji(urlState.emotion.value) }}
          </span>
          <span class="text-[15px] font-bold text-slate-900 leading-tight line-clamp-2">
            {{ contextTitle }}
          </span>
        </div>
        <div class="text-[12px] font-medium text-slate-500 mt-1">
          {{ subtitleText }}
        </div>
      </div>
      
      <button @click="urlState.closePanel" class="p-2 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-full transition-colors shrink-0">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="px-5 py-2.5 border-b border-slate-100 flex items-center gap-2 shrink-0">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Emotion:</span>
      <div class="flex items-center gap-1">
        <button
          v-for="m in EMOTION_METRICS"
          :key="m"
          @click="toggleEmotionChip(m)"
          :class="[
            'w-7 h-7 flex items-center justify-center rounded-full text-[16px] leading-none transition-all',
            urlState.emotion.value === m
              ? 'bg-bloom-primary/10 ring-2 ring-bloom-primary scale-110'
              : 'hover:bg-slate-100 opacity-70 hover:opacity-100'
          ]"
          :title="emotionLabel(m)"
        >
          {{ getEmoji(m) }}
        </button>
      </div>
    </div>

    <div class="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-50">
      <Dropdown v-model="activeSort" :options="sortOptions" variant="minimal" prefix="Sort:" class="text-sm" />
      
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highlight:</span>
        <div class="flex items-center bg-slate-100 p-1 rounded-lg">
          <button 
            @click="setHighlightMode('none')"
            :class="['px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors', currentHighlightMode === 'none' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            None
          </button>
          <button 
            @click="setHighlightMode('emotion')"
            :class="['px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors', currentHighlightMode === 'emotion' ? 'bg-white text-bloom-primary shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Emotion
          </button>
          <button 
            @click="setHighlightMode('issue')"
            :disabled="!urlState.panelIsIssueScoped.value"
            :title="urlState.panelIsIssueScoped.value ? 'Highlight AI-identified evidence for this issue' : 'Select a specific issue to enable issue-bits highlight'"
            :class="[
              'px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors',
              !urlState.panelIsIssueScoped.value 
                ? 'text-slate-400 opacity-50 cursor-not-allowed' 
                : currentHighlightMode === 'issue' 
                  ? 'bg-white text-violet-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
            ]"
          >
            Issue
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-5 relative z-10 hide-scrollbar">
      
      <div v-if="!isListReady" key="loading" class="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <svg class="animate-spin h-6 w-6 text-bloom-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span class="text-xs font-bold uppercase tracking-wider">Loading Interactions...</span>
      </div>

      <div v-else-if="activeInteractionsList.length === 0" key="empty" class="text-center text-slate-400 py-10 text-sm">
        {{ emptyMessage }}
      </div>

      <div v-else key="feed" class="flex flex-col gap-5">
        <div 
          v-for="interaction in activeInteractionsList" 
          :key="interaction.id"
          class="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col"
        >
          <div class="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {{ interaction.country || 'US' }}
              </span>
              <span class="text-[12px] font-semibold text-slate-400">
                {{ formatSource(interaction.sourceId) }}
              </span>
            </div>
            <span class="text-[11px] font-medium text-slate-400">
              {{ formatDate(interaction.updatedAtSource || interaction.createdAt) }}
            </span>
          </div>

          <p 
            class="text-[14px] text-slate-700 leading-relaxed"
            v-html="renderHighlightedContent(interaction)"
          ></p>
          
          <div v-if="interaction.score" class="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1 text-[12px] font-semibold text-amber-500">
            <span v-for="n in 5" :key="n" :class="n <= Number(interaction.score.value) ? 'text-amber-400' : 'text-slate-200'">★</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, watch, onUnmounted } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'
import { useBloomUrlState } from '@/composables/useBloomUrlState'
import Dropdown from '@/components/common/Dropdown.vue'

const bloomStore = useBloomStore()
const ui = useUiStore()
const urlState = useBloomUrlState()

// --- CONSTANTS ---
const EMOTION_METRICS = ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']

const EMOTION_LABELS = {
  joy: 'Joy',
  confidence: 'Confidence',
  engagement: 'Engagement',
  frustration: 'Frustration',
  hopelessness: 'Hopelessness',
}

const EMOTION_HIGHLIGHT_CLASS = {
  joy:          'bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded',
  confidence:   'bg-blue-100 text-blue-900 font-semibold px-0.5 rounded',
  engagement:   'bg-slate-200 text-slate-900 font-semibold px-0.5 rounded',
  frustration:  'bg-orange-100 text-orange-900 font-semibold px-0.5 rounded',
  hopelessness: 'bg-rose-100 text-rose-900 font-semibold px-0.5 rounded',
}

const ISSUE_HIGHLIGHT_CLASS = 'bg-violet-100 text-violet-900 font-semibold px-0.5 rounded'

// Cap on the recent-everything default state (no scope, no emotion filter).
// Filtered/scoped views show the full set.
const DEFAULT_STATE_CAP = 100

// --- LOCAL STATE ---
const activeSort = ref('newest')
const isListReady = ref(false)
const activeInteractionsList = shallowRef([])

const sortOptions = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'longest', label: 'Longest' }
]

// --- HIGHLIGHT MODE (derived from URL) ---
// Four URL states, three UI states:
//   - none: neither emotion nor hl set
//   - emotion: emotion=<m> OR hl=emotion
//   - issue: hl=issue
const currentHighlightMode = computed(() => {
  if (urlState.emotion.value || urlState.hl.value === 'emotion') return 'emotion'
  if (urlState.hl.value === 'issue') return 'issue'
  return 'none'
})

const setHighlightMode = (mode) => {
  if (mode === 'none') {
    // Clear both — explicitly leaving emotion mode
    urlState.setEmotion(null)
    urlState.setHl(null)
    return
  }
  if (mode === 'emotion') {
    // If a specific emotion was already active, keep it. Otherwise
    // enter the multi-color "any emotion" mode.
    if (urlState.emotion.value) return  // Already in emotion mode with a chip
    urlState.setHl('emotion')
    return
  }
  if (mode === 'issue') {
    if (!urlState.panelIsIssueScoped.value) return  // Defensive — button is disabled
    urlState.setHl('issue')
  }
}

// --- CHIP ROW ---
// Clicking a chip:
//   - If different from current emotion: filter to that emotion
//   - If matches current emotion: clear it, fall back to hl=emotion
//     (so we're still in "Emotion mode" but no specific filter)
const toggleEmotionChip = (metric) => {
  if (urlState.emotion.value === metric) {
    urlState.setEmotion(null)
    urlState.setHl('emotion')
  } else {
    urlState.setEmotion(metric)
  }
}

// --- CONTEXT (title + subtitle) ---
// Walk the bloom tree to resolve a taxo (at any depth) to a title.
const titleForTaxo = (taxo) => {
  if (!taxo || !bloomStore.currentBloom?.categories) return null
  const parts = taxo.split(':')

  const category = bloomStore.currentBloom.categories.find(c => c.taxo === parts[0])
  if (!category) return null
  if (parts.length === 1) return category.title

  const topicTaxo = `${parts[0]}:${parts[1]}`
  const topic = category.topics?.find(t => t.taxo === topicTaxo)
  if (!topic) return category.title
  if (parts.length === 2) return topic.title

  const issueTaxo = `${parts[0]}:${parts[1]}:${parts[2]}`
  const issue = topic.issues?.find(i => i.taxo === issueTaxo)
  return issue?.title || topic.title
}

// The panel's scope is whatever urlState.panelScopeTaxo resolves to
// (forIssue || taxo). At title-level, walk the tree.
const contextTitle = computed(() => {
  const scope = urlState.panelScopeTaxo.value
  if (scope) {
    return titleForTaxo(scope) || 'Selected scope'
  }
  if (urlState.emotion.value) {
    return `${EMOTION_LABELS[urlState.emotion.value]} Expressions`
  }
  if (urlState.hl.value === 'emotion') {
    return 'All Emotional Expressions'
  }
  return 'Most Recent Interactions'
})

const isUnfilteredDefault = computed(() => {
  return (
    !urlState.panelScopeTaxo.value &&
    !urlState.emotion.value
  )
})

const subtitleText = computed(() => {
  if (isUnfilteredDefault.value) {
    return `Showing up to ${DEFAULT_STATE_CAP} recent interactions`
  }
  return `${formatNumber(activeInteractionsList.value.length)} interactions found`
})

// Context-aware empty message
const emptyMessage = computed(() => {
  if (urlState.emotion.value) {
    const label = EMOTION_LABELS[urlState.emotion.value].toLowerCase()
    return `No ${label} interactions in this scope.`
  }
  return 'No interactions match this context.'
})

// --- INTERACTION LIST BUILDER ---
// Builds the list of interactions to show, scoped by panelScopeTaxo
// (forIssue || taxo) and optionally filtered by emotion. Returns a
// fresh sorted array.
const buildInteractionList = () => {
  const scope = urlState.panelScopeTaxo.value
  const emotion = urlState.emotion.value
  const issues = bloomStore.allIssues || []

  // Step 1: collect candidates, deduped by interaction id.
  // - scope at issue level: only that issue's interactions
  // - scope at topic/category: union across matching issues
  // - no scope: union across the full report
  const seen = new Set()
  const collected = []

  const scopedIssues = scope
    ? issues.filter(iss => iss.taxo === scope || iss.taxo.startsWith(`${scope}:`))
    : issues

  scopedIssues.forEach(iss => {
    (iss.interactions || []).forEach(int => {
      if (seen.has(int.id)) return
      // Optional emotion filter
      if (emotion) {
        const hasMetric = int.analysis?.joy?.some(j => j.metric === emotion)
        if (!hasMetric) return
      }
      seen.add(int.id)
      collected.push(int)
    })
  })

  // Step 2: sort
  const sortVal = activeSort.value
  collected.sort((a, b) => {
    if (sortVal === 'longest') {
      return (b.content?.raw?.length || 0) - (a.content?.raw?.length || 0)
    }
    const timeA = new Date(a.updatedAtSource || a.createdAt).getTime()
    const timeB = new Date(b.updatedAtSource || b.createdAt).getTime()
    return sortVal === 'newest' ? timeB - timeA : timeA - timeB
  })

  // Step 3: situational cap. Only when truly unfiltered.
  return isUnfilteredDefault.value ? collected.slice(0, DEFAULT_STATE_CAP) : collected
}

// --- DEFERRED RENDER ENGINE ---
// 500ms delay covers the sidebar slide animation. Watcher depends on
// bloomStore.allIssues so cold loads (URL → render before data lands)
// re-trigger correctly.
let renderTimeout = null

watch(
  () => [
    urlState.taxo.value,
    urlState.forIssue.value,
    urlState.emotion.value,
    urlState.hl.value,
    activeSort.value,
    ui.activeRightTab,
    bloomStore.currentBloom,
  ],
  ([, , , , , activeTab]) => {
    if (activeTab !== 'interactions') {
      activeInteractionsList.value = []
      isListReady.value = false
      return
    }

    // If data hasn't loaded yet, stay in loading state
    if (!bloomStore.currentBloom?.categories) {
      isListReady.value = false
      activeInteractionsList.value = []
      return
    }

    isListReady.value = false
    activeInteractionsList.value = []

    clearTimeout(renderTimeout)
    renderTimeout = setTimeout(() => {
      activeInteractionsList.value = buildInteractionList()
      isListReady.value = true
    }, 500)
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(renderTimeout))

// --- HIGHLIGHT ENGINE ---
// Three modes:
//   - 'none'    → no marks
//   - 'emotion' → emotion bits. If a specific emotion is set, single
//                 color. If not (hl=emotion), all emotions in their
//                 own colors.
//   - 'issue'   → issue bits from interaction.issueMeta.meta.bits, violet.

/**
 * Returns an array of { start, end, class } objects representing the
 * bit ranges to highlight in this interaction, given the current mode.
 * Returns empty array if there's nothing to highlight.
 */
const getColoredBitsForMode = (interaction) => {
  const mode = currentHighlightMode.value
  if (mode === 'none') return []

  if (mode === 'issue') {
    const bits = interaction.issueMeta?.meta?.bits
    if (!bits || bits.length === 0) return []
    return bits.map(([s, e]) => ({ start: s, end: e, class: ISSUE_HIGHLIGHT_CLASS }))
  }

  if (mode === 'emotion') {
    const specificMetric = urlState.emotion.value
    const joyAnalysis = interaction.analysis?.joy
    if (!joyAnalysis) return []

    // Specific emotion: only that metric's bits, single color
    if (specificMetric) {
      const metricData = joyAnalysis.find(j => j.metric === specificMetric)
      if (!metricData?.bits) return []
      return metricData.bits.map(([s, e]) => ({
        start: s,
        end: e,
        class: EMOTION_HIGHLIGHT_CLASS[specificMetric],
      }))
    }

    // No specific emotion (hl=emotion): all metrics' bits, each colored
    const out = []
    joyAnalysis.forEach(metricData => {
      const klass = EMOTION_HIGHLIGHT_CLASS[metricData.metric]
      if (!klass || !metricData.bits) return
      metricData.bits.forEach(([s, e]) => {
        out.push({ start: s, end: e, class: klass })
      })
    })
    return out
  }

  return []
}

const renderHighlightedContent = (interaction) => {
  const rawText = interaction.content?.raw || ''
  if (!rawText || currentHighlightMode.value === 'none') return rawText

  const coloredBits = getColoredBitsForMode(interaction)
  if (coloredBits.length === 0) return rawText

  return applyColoredBits(rawText, coloredBits)
}

/**
 * Wrap given bit ranges in <mark> tags with their respective classes,
 * expanding each range to word boundaries (AI sometimes drops indexes
 * mid-word). Bits of the same class that overlap or are adjacent are
 * merged; bits of different classes never merge — they emit separate
 * marks.
 *
 * Strategy: expand each bit to word boundaries, sort by start, then
 * walk left-to-right. At any point in the raw text, we have zero or
 * more "active" bits overlapping. We emit a <mark> for whichever bit
 * starts the run, then continue until that bit ends.
 *
 * If overlaps of different classes need to be handled (e.g., emotion
 * mode shows joy AND frustration bits and they overlap), we use the
 * earlier-starting class. Same-class adjacent ranges merge naturally.
 */
const applyColoredBits = (rawText, coloredBits) => {
  // Expand to word boundaries
  const expanded = coloredBits.map(({ start, end, class: klass }) => {
    let s = start, e = end
    while (s > 0 && /\w/.test(rawText[s - 1])) s--
    while (e < rawText.length - 1 && /\w/.test(rawText[e + 1])) e++
    return { start: s, end: e, class: klass }
  })

  // Sort by start, then by end (later end first for stability)
  expanded.sort((a, b) => a.start - b.start || b.end - a.end)

  // Merge same-class adjacent/overlapping ranges
  const merged = []
  expanded.forEach(bit => {
    if (!merged.length) {
      merged.push({ ...bit })
      return
    }
    const last = merged[merged.length - 1]
    // Merge only when same class AND overlapping/adjacent
    if (bit.class === last.class && bit.start <= last.end + 1) {
      last.end = Math.max(last.end, bit.end)
    } else {
      merged.push({ ...bit })
    }
  })

  // Build output. For different-class overlaps we just emit
  // sequentially using the earlier-starting bit; the renderer doesn't
  // try to nest marks (would be hard to read anyway).
  let result = ''
  let cursor = 0
  merged.forEach(({ start, end, class: klass }) => {
    if (start < cursor) {
      // Already past this start (overlap with previous). Trim.
      if (end < cursor) return  // fully consumed
      start = cursor
    }
    result += rawText.substring(cursor, start)
    result += `<mark class="${klass}">${rawText.substring(start, end + 1)}</mark>`
    cursor = end + 1
  })
  result += rawText.substring(cursor)
  return result
}

// --- UTILITIES ---
const formatSource = (src) => {
  if (src === 'apple_app_store') return 'App Store'
  if (src === 'google_play') return 'Google Play'
  return src || 'Unknown'
}

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const getEmoji = (m) => ({ joy: '✨', confidence: '😎', engagement: '👀', frustration: '😤', hopelessness: '😔' }[m] || '😶')
const emotionLabel = (m) => EMOTION_LABELS[m] || m
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>