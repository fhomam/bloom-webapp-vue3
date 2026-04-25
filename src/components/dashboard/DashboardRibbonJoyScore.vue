<template>
  <div 
    class="flex flex-col gap-1 cursor-pointer group rounded-xl max-w-fit mx-auto min-[480px]:mx-0"
    @click="uiState.showJoyDimensions = !uiState.showJoyDimensions"
  >
    <div class="flex items-end gap-2 lg:gap-3 relative">
      <span class="text-3xl lg:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
        {{ joyScore }}
      </span>
      <div class="flex flex-col pb-0.5 lg:pb-1">
        
        <div class="flex items-center gap-1.5 relative">
          <span class="text-base lg:text-2xl leading-none">{{ joyEmoji }}</span>
          
          <button 
            class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            @click.stop="uiState.showInfoPopup = !uiState.showInfoPopup" 
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>

          <div 
            v-if="uiState.showInfoPopup" 
            class="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 text-left cursor-default animate-in fade-in zoom-in-95 duration-200" 
            @click.stop
          >
            <p class="text-xs text-slate-600 leading-relaxed mb-3">
              The Joy Score surfaces a 5-dimensional metric from organic customer interactions to help assess the health of an offering.
            </p>
            <a 
              href="https://www.withbloom.ai/two-pagers/the-joy-score" 
              target="_blank" 
              class="text-[11px] font-bold text-bloom-primary hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              Read the Joy Two-Pager
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>
        </div>

        <span class="text-[9px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
          {{ joyLabel }}
        </span>
      </div>
    </div>
    
    <div class="hidden md:flex min-h-[40px] min-w-[240px] flex-col justify-center mt-1">
      
      <div v-if="!uiState.showJoyDimensions" class="text-[11px] lg:text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
        Encompasses <strong>{{ formattedInteractions }}</strong> interactions<br />
        across <strong>{{ displayedSourceCount }}</strong> {{ displayedSourceCount === 1 ? 'source' : 'sources' }}
        <template v-if="smartLocale">
          & <strong>{{ smartLocale.count }}</strong> {{ smartLocale.label }}
        </template>
      </div>

      <div v-else class="flex flex-col gap-1.5 w-full pr-4 animate-in fade-in duration-300">
        <div class="w-full h-1 flex rounded-full overflow-hidden bg-slate-100 opacity-90">
          <div :style="{ width: `${dimensions.hopelessness}%` }" class="bg-rose-500"></div>
          <div :style="{ width: `${dimensions.frustration}%` }" class="bg-orange-400"></div>
          <div :style="{ width: `${dimensions.engagement}%` }" class="bg-slate-300"></div>
          <div :style="{ width: `${dimensions.confidence}%` }" class="bg-blue-400"></div>
          <div :style="{ width: `${dimensions.joy}%` }" class="bg-emerald-400"></div>
        </div>
        <div class="flex justify-between w-full text-[10px] lg:text-[12px] font-medium text-slate-400">
          <span>😔 {{ dimensions.hopelessness }}%</span>
          <span>😤 {{ dimensions.frustration }}%</span>
          <span>👀 {{ dimensions.engagement }}%</span>
          <span>😎 {{ dimensions.confidence }}%</span>
          <span>✨ {{ dimensions.joy }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'

const bloomStore = useBloomStore()
const route = useRoute()

const uiState = reactive({
  showJoyDimensions: false,
  showInfoPopup: false 
})

const closePopup = () => { uiState.showInfoPopup = false }
onMounted(() => document.addEventListener('click', closePopup))
onBeforeUnmount(() => document.removeEventListener('click', closePopup))

// --- SMART LOCALE & SOURCE ROUTING ---

const allAvailableSources = computed(() => {
  if (!bloomStore.sourceInteractionStats) return []
  return Object.keys(bloomStore.sourceInteractionStats)
})

const activeSource = computed(() => route.query.srcId || 'all')

const displayedSourceCount = computed(() => {
  if (activeSource.value !== 'all') return 1;
  return allAvailableSources.value.length;
})

const smartLocale = computed(() => {
  let targetSource = null;
  
  if (activeSource.value !== 'all') {
    targetSource = activeSource.value; 
  } else if (allAvailableSources.value.length === 1) {
    targetSource = allAvailableSources.value[0]; 
  }

  if (!targetSource) return null;

  const stats = bloomStore.sourceInteractionStats?.[targetSource];
  if (!stats) return null;

  if (targetSource === 'apple_app_store' && stats.country) {
    const count = Object.keys(stats.country).filter(c => c !== 'global' && c !== 'default').length;
    return { count, label: count === 1 ? 'country' : 'countries' };
  }

  if (targetSource === 'google_play' && stats.lang) {
    const count = Object.keys(stats.lang).filter(l => l !== 'global' && l !== 'default').length;
    return { count, label: count === 1 ? 'language' : 'languages' };
  }

  return null;
})

// --- MATH & FORMATTING ---

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)

const getEmoji = (desc) => {
  const map = {
    "Mostly Hopeless": '😔', "Leaning Hopeless": '😔',
    "Mostly Frustrated": '😤',
    "Contentious": '🤔', "Inconclusive": '😶',
    "Leaning Engaged": '👀', "Positively Engaged": '👀',
    "Leaning Confident": '😎', "Confident": '😎',
    "Joyful": '✨'
  }
  return map[desc] || '😶'
}

const joyScore = computed(() => {
  const score = bloomStore.joyStats?.score
  return typeof score === 'number' ? score.toFixed(2) : '0.00'
})

const uniqueInteractionCount = computed(() => {
  const unique = new Set()
  bloomStore.allIssues?.forEach(issue => {
    issue.interactions?.forEach(i => unique.add(i.id))
  })
  return unique.size
})

const joyLabel = computed(() => bloomStore.joyStats?.scoreDescription || 'Loading...')
const joyEmoji = computed(() => getEmoji(joyLabel.value))
const formattedInteractions = computed(() => formatNumber(uniqueInteractionCount.value))

const dimensions = computed(() => {
  const m = bloomStore.joyStats?.metrics
  if (!m) return { hopelessness: 0, frustration: 0, engagement: 0, confidence: 0, joy: 0 }
  
  const total = (m.joy || 0) + (m.confidence || 0) + (m.engagement || 0) + (m.frustration || 0) + (m.hopelessness || 0)
  if (total === 0) return { hopelessness: 0, frustration: 0, engagement: 0, confidence: 0, joy: 0 }

  return {
    hopelessness: Math.round(((m.hopelessness || 0) / total) * 100),
    frustration: Math.round(((m.frustration || 0) / total) * 100),
    engagement: Math.round(((m.engagement || 0) / total) * 100),
    confidence: Math.round(((m.confidence || 0) / total) * 100),
    joy: Math.round(((m.joy || 0) / total) * 100)
  }
})
</script>