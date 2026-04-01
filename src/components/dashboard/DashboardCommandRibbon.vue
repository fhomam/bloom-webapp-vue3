<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
    
    <div 
      class="flex flex-col gap-2 xl:w-1/3 cursor-pointer group p-2 -ml-2 rounded-xl"
      @click="uiState.showJoyDimensions = !uiState.showJoyDimensions"
      title="Click to toggle Emotional Composition"
    >
      <div class="flex items-end gap-3 relative">
        <span class="text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
          {{ joyScore }}
        </span>
        <div class="flex flex-col pb-1">
          <div class="flex items-center gap-1.5">
            <span class="text-2xl leading-none">{{ joyEmoji }}</span>
            <button class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer" @click.stop="openTwoPager('joy')" title="View Joy Score 2-Pager">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            {{ joyLabel }}
          </span>
        </div>
      </div>
      
      <div class="min-h-[40px] flex flex-col justify-center mt-1">
        
        <div v-if="!uiState.showJoyDimensions" class="text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
          Encompasses <strong>{{ formattedInteractions }}</strong> interactions<br />
          across <strong>{{ stats.countries }}</strong> countries & <strong>{{ stats.sources }}</strong> sources
        </div>

        <div v-else class="flex flex-col gap-1.5 w-full pr-4 animate-in fade-in duration-300">
          <div class="w-full h-1 flex rounded-full overflow-hidden bg-slate-100 opacity-90">
            <div :style="{ width: `${dimensions.hopelessness}%` }" class="bg-rose-500"></div>
            <div :style="{ width: `${dimensions.frustration}%` }" class="bg-orange-400"></div>
            <div :style="{ width: `${dimensions.engagement}%` }" class="bg-slate-300"></div>
            <div :style="{ width: `${dimensions.confidence}%` }" class="bg-blue-400"></div>
            <div :style="{ width: `${dimensions.joy}%` }" class="bg-emerald-400"></div>
          </div>
          <div class="flex justify-between w-full text-[14px] font-medium text-slate-400">
            <span>😔 {{ dimensions.hopelessness }}%</span>
            <span>😤 {{ dimensions.frustration }}%</span>
            <span>👀 {{ dimensions.engagement }}%</span>
            <span>😎 {{ dimensions.confidence }}%</span>
            <span>✨ {{ dimensions.joy }}%</span>
          </div>
        </div>

      </div>
    </div>

    <div class="flex flex-col items-center justify-center xl:w-1/3 text-center">
      
      <span class="text-[10px] font-extrabold text-bloom-primary uppercase tracking-[0.2em] mb-1.5">
        Executive Dashboard
      </span>
      
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 leading-none">
        {{ offeringTitle }}
      </h2>
      
      <div class="flex items-center text-[15px] font-bold text-slate-800 tracking-tight mt-5">
        <div class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" title="Change Period Type">
          {{ activePeriodType }}
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <span class="mx-2 text-slate-300 font-light">/</span>
        <div class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" title="Change Period">
          {{ activePeriodId }}
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>

    <div class="flex justify-end xl:w-1/3">
      <div class="flex items-center gap-5">
        
        <div class="flex flex-col items-end text-right hidden sm:flex">
          <span class="text-[15px] font-bold text-slate-900">{{ companyMeta.name }}</span>
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Est. Users: {{ companyMeta.users }}</span>
        </div>
        
        <div class="h-10 w-px bg-slate-200 hidden sm:block"></div> <div class="flex flex-col items-end justify-center pt-1">
          <div class="flex items-center gap-2">
            
            <div 
              class="flex items-end gap-[3px] h-5 cursor-pointer relative mr-1 group" 
              @click="uiState.showPmiDetails = !uiState.showPmiDetails"
              title="Click to view quarterly trend"
            >
              <div v-for="(q, idx) in pmiHistory" :key="idx" 
                   :class="['w-1.5 rounded-sm transition-colors', idx === pmiHistory.length - 1 ? 'bg-slate-800' : 'bg-slate-200 group-hover:bg-slate-300']"
                   :style="{ height: `${q.percent}%` }">
              </div>

              <div v-if="uiState.showPmiDetails" class="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 flex gap-4 text-xs">
                <div v-for="(q, idx) in pmiHistory" :key="idx" class="flex flex-col items-center">
                  <span class="text-slate-400 font-medium">{{ q.label }}</span>
                  <span class="text-slate-900 font-bold">{{ q.score }}%</span>
                </div>
              </div>
            </div>

            <span class="text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">{{ pmiScore }}%</span>
            <span :class="['text-sm font-bold', pmiDelta > 0 ? 'text-rose-500' : 'text-emerald-500']">
              {{ pmiDelta > 0 ? '+' : '' }}{{ pmiDelta }}%
            </span>

            <button class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer ml-1" @click.stop="openTwoPager('pmi')" title="View PMI 2-Pager">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Product Market Impedance</span>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'

const route = useRoute()
const bloomStore = useBloomStore()

// --- UI STATE ---
const uiState = reactive({
  showJoyDimensions: false,
  showPmiDetails: false
})

// --- UTILITIES ---
const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)
const formatCompact = (num) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(num || 0)

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

const openTwoPager = (type) => {
  console.log(`Routing to ${type} 2-pager...`)
}

// --- DYNAMIC JOY DATA ---
const joyScore = computed(() => {
  const score = bloomStore.joyStats?.score
  return typeof score === 'number' ? score.toFixed(2) : '0.00'
})

const joyLabel = computed(() => bloomStore.joyStats?.scoreDescription || 'Loading...')
const joyEmoji = computed(() => getEmoji(joyLabel.value))

const formattedInteractions = computed(() => formatNumber(bloomStore.joyStats?.metrics?.reviewsAnalyzed))

// Emotional Dimensions (%)
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

// --- DYNAMIC META DATA (Sources & Countries) ---
const stats = computed(() => {
  const rawStats = bloomStore.countryReviewStats
  if (!rawStats) return { sources: 0, countries: 0 }

  const sourceKeys = Object.keys(rawStats)
  const uniqueCountries = new Set()

  sourceKeys.forEach(source => {
    Object.keys(rawStats[source] || {}).forEach(country => uniqueCountries.add(country))
  })

  return {
    sources: sourceKeys.length,
    countries: uniqueCountries.size
  }
})

// --- CONTEXT & PERIOD ---
const offeringTitle = computed(() => bloomStore.offeringContext?.name || 'Loading...')
const companyMeta = computed(() => ({
  name: bloomStore.offeringContext?.developer?.name || 'Unknown Developer',
  // Converts e.g. 352444758 into "352M"
  users: bloomStore.offeringContext?.installs ? formatCompact(bloomStore.offeringContext.installs) : 'Unknown'
}))

const activePeriodType = computed(() => {
  const pt = route.params.periodType || 'quarterly'
  return pt.charAt(0).toUpperCase() + pt.slice(1)
})

const activePeriodId = computed(() => (route.params.periodId || '2026Q1').toUpperCase())

// --- MOCKED PMI DATA (Pending Formula!) ---
const pmiScore = ref(3.2)
const pmiDelta = ref(+0.4)
const pmiHistory = ref([
  { label: '25Q2', score: 2.1, percent: 40 },
  { label: '25Q3', score: 2.5, percent: 60 },
  { label: '25Q4', score: 2.8, percent: 50 },
  { label: '26Q1', score: 3.2, percent: 80 }
])
</script>
