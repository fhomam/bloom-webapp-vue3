<template>
  <div class="flex flex-col h-full w-full bg-white relative">
    
    <div class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
      <div class="flex flex-col min-w-0">
        <h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Interaction Explorer
        </h2>
        <div class="flex items-start gap-2">
          <span v-if="exploreEmotion" class="text-xl leading-none">
          {{ getEmoji(exploreEmotion) }}</span>
          <span class="text-[15px] font-bold text-slate-900 leading-tight line-clamp-2">
            {{ contextTitle }}
          </span>
        </div>
        <div class="text-[12px] font-medium text-slate-500 mt-1">
          {{ isDefaultState ? 'Showing up to 100 recent interactions' : formatNumber(activeInteractionsList.length) + ' interactions found' }}
        </div>
      </div>
      
      <button @click="closeExplorer" class="p-2 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-full transition-colors shrink-0">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-50">
      <Dropdown v-model="activeSort" :options="sortOptions" variant="minimal" prefix="Sort:" class="text-sm" />
      
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Highlight:</span>
        <div class="flex items-center bg-slate-100 p-1 rounded-lg">
          <button 
            @click="highlightMode = 'none'"
            :class="['px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors', highlightMode === 'none' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            None
          </button>
          <button 
            @click="highlightMode = 'emotion'"
            :class="['px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors', highlightMode === 'emotion' ? 'bg-white text-bloom-primary shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Emotion
          </button>
          <button 
            disabled
            title="Coming soon: Highlight specific issue details"
            class="px-2.5 py-1 text-[11px] font-bold rounded uppercase tracking-wide transition-colors text-slate-400 opacity-50 cursor-not-allowed"
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
        No interactions match this context.
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
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'
import Dropdown from '@/components/common/Dropdown.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()
const ui = useUiStore()

// --- URL PARAMS ---
const exploreIssue = computed(() => route.query.exploreIssue ? route.query.exploreIssue.replaceAll('-', ':') : null)
const exploreEmotion = computed(() => route.query.exploreEmotion || null)

// --- STATE ---
const activeSort = ref('newest')
const highlightMode = ref(exploreEmotion.value ? 'emotion' : 'none')
const isListReady = ref(false)

// HIGH PERFORMANCE: shallowRef skips deep reactivity for massive JSON objects!
const activeInteractionsList = shallowRef([]) 

const sortOptions = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'longest', label: 'Longest' }
]

const dimConfig = {
  joy:          { highlightClass: 'bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded' },
  confidence:   { highlightClass: 'bg-blue-100 text-blue-900 font-semibold px-0.5 rounded' },
  engagement:   { highlightClass: 'bg-slate-200 text-slate-900 font-semibold px-0.5 rounded' },
  frustration:  { highlightClass: 'bg-orange-100 text-orange-900 font-semibold px-0.5 rounded' },
  hopelessness: { highlightClass: 'bg-rose-100 text-rose-900 font-semibold px-0.5 rounded' }
}

// --- CONTEXT COMPUTERS ---
const isDefaultState = computed(() => !exploreIssue.value && !exploreEmotion.value)

const targetIssue = computed(() => {
  if (!exploreIssue.value) return null
  return bloomStore.allIssues.find(iss => iss.taxo === exploreIssue.value) || null
})

const contextTitle = computed(() => {
  if (exploreIssue.value && targetIssue.value) return targetIssue.value.title
  if (exploreEmotion.value) return `${exploreEmotion.value.charAt(0).toUpperCase() + exploreEmotion.value.slice(1)} Expressions`
  return 'Most Recent Interactions'
})

// --- SMART DEFERRED RENDER ENGINE ---
let renderTimeout = null

watch(
  // We now watch ui.activeRightTab as well!
  () => [exploreEmotion.value, exploreIssue.value, activeSort.value, ui.activeRightTab],
  ([newEmotion, newIssue, sortVal, activeTab], [oldEmotion, oldIssue] = []) => {
    
    // 1. Update Highlight Mode
    if (newEmotion && newEmotion !== oldEmotion) {
      highlightMode.value = 'emotion'
    } else if (newIssue && newIssue !== oldIssue) {
      highlightMode.value = 'none'
    }

    // INSTANT ABORT (THE FIX): If this tab isn't active, wipe the list to free memory 
    // and completely halt the CPU work. This keeps the Taxonomy load buttery smooth!
    if (activeTab !== 'interactions') {
      activeInteractionsList.value = []
      isListReady.value = false
      return 
    }

    // 2. Instantly clear the list and show spinner
    isListReady.value = false
    activeInteractionsList.value = []

    // 3. Wait for the 300ms CSS sidebar slide animation to completely finish
    clearTimeout(renderTimeout)
    renderTimeout = setTimeout(() => {
      
      let list = []
      
      if (exploreIssue.value && targetIssue.value) {
        list = targetIssue.value.interactions || []
      } 
      else if (exploreEmotion.value) {
        const seen = new Set()
        bloomStore.allIssues.forEach(iss => {
          (iss.interactions || []).forEach(int => {
            if (!seen.has(int.id) && int.analysis?.joy?.some(j => j.metric === exploreEmotion.value)) {
              list.push(int)
              seen.add(int.id)
            }
          })
        })
      } 
      else {
        const seen = new Set()
        bloomStore.allIssues.forEach(iss => {
          (iss.interactions || []).forEach(int => {
            if (!seen.has(int.id)) {
              list.push(int)
              seen.add(int.id)
            }
          })
        })
      }

      const sorted = [...list].sort((a, b) => {
        if (sortVal === 'longest') {
          return (b.content?.raw?.length || 0) - (a.content?.raw?.length || 0)
        }
        const timeA = new Date(a.updatedAtSource || a.createdAt).getTime()
        const timeB = new Date(b.updatedAtSource || b.createdAt).getTime()
        return sortVal === 'newest' ? timeB - timeA : timeA - timeB
      })

      // Assign to shallowRef, triggering exactly ONE render update
      activeInteractionsList.value = isDefaultState.value ? sorted.slice(0, 100) : sorted
      isListReady.value = true

    }, 500)
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(renderTimeout))


// --- HIGHLIGHT ENGINE ---
const renderHighlightedContent = (interaction) => {
  const rawText = interaction.content?.raw || ''
  if (!rawText || highlightMode.value === 'none') return rawText

  if (highlightMode.value === 'emotion') {
    if (!interaction.analysis?.joy || interaction.analysis.joy.length === 0) return rawText
    const targetMetric = exploreEmotion.value || interaction.analysis.joy[0].metric
    const metricData = interaction.analysis.joy.find(j => j.metric === targetMetric)
    
    if (!metricData || !metricData.bits) return rawText
    return applyBits(rawText, metricData.bits, dimConfig[targetMetric]?.highlightClass || 'bg-slate-200 text-slate-900 font-semibold px-0.5 rounded')
  } 

  return rawText
}

const applyBits = (rawText, bits, colorClass) => {
  let expandedBits = bits.map(([start, end]) => {
    let s = start, e = end
    while (s > 0 && /\w/.test(rawText[s - 1])) s--
    while (e < rawText.length - 1 && /\w/.test(rawText[e + 1])) e++
    return [s, e]
  })

  expandedBits.sort((a, b) => a[0] - b[0])
  let mergedBits = []
  expandedBits.forEach(bit => {
    if (!mergedBits.length) mergedBits.push([...bit])
    else {
      let last = mergedBits[mergedBits.length - 1]
      if (bit[0] <= last[1] + 1) last[1] = Math.max(last[1], bit[1])
      else mergedBits.push([...bit])
    }
  })

  let result = '', currentIndex = 0
  mergedBits.forEach(([start, end]) => {
    result += rawText.substring(currentIndex, start)
    result += `<mark class="${colorClass}">` + rawText.substring(start, end + 1) + `</mark>`
    currentIndex = end + 1
  })
  
  result += rawText.substring(currentIndex)
  return result
}

// --- UTILITIES ---
const closeExplorer = () => {
  ui.isRightOpen = false 
  
  setTimeout(() => {
    const newQuery = { ...route.query }
    delete newQuery.exploreIssue
    delete newQuery.exploreEmotion
    router.push({ query: newQuery })
  }, 300)
}

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
const getEmoji = (m) => ({ joy:'✨', confidence:'😎', engagement:'👀', frustration:'😤', hopelessness:'😔' }[m] || '😶')
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>