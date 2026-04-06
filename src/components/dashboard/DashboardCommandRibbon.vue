<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-sm grid grid-cols-2 md:grid-cols-[auto_1fr_auto] gap-y-5 gap-x-4 lg:gap-x-8 items-center relative z-10 w-full">
    
    <div 
      class="col-span-1 md:col-span-1 row-start-2 md:row-start-1 flex flex-col gap-1 cursor-pointer group rounded-xl max-w-fit"
      @click="uiState.showJoyDimensions = !uiState.showJoyDimensions"
      title="Click to toggle Emotional Composition"
    >
      <div class="flex items-end gap-2 lg:gap-3 relative">
        <span class="text-2xl lg:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
          {{ joyScore }}
        </span>
        <div class="flex flex-col pb-0.5 lg:pb-1">
          <div class="flex items-center gap-1.5">
            <span class="text-base lg:text-2xl leading-none">{{ joyEmoji }}</span>
            <button class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer" @click.stop="openTwoPager('joy')" title="View Joy Score 2-Pager">
              <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <span class="text-[9px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            {{ joyLabel }}
          </span>
        </div>
      </div>
      
      <div class="hidden md:flex min-h-[40px] flex-col justify-center mt-1">
        <div v-if="!uiState.showJoyDimensions" class="text-[11px] lg:text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
          Encompasses <strong>{{ formattedInteractions }}</strong> interactions<br />
          across <strong>{{ availableCountries.length }}</strong> countries & <strong>{{ availableSources.length }}</strong> sources
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

    <div class="col-span-2 md:col-span-1 row-start-1 md:row-start-1 flex flex-col items-center justify-center text-center min-w-0 w-full px-2">
      <span class="text-[9px] lg:text-[10px] font-extrabold text-bloom-primary uppercase tracking-[0.2em] mb-1.5">
        Executive Dashboard
      </span>
      
      <h2 class="text-lg lg:text-2xl font-bold text-slate-900 tracking-tight text-center leading-tight mb-3 lg:mb-4 w-full">
        {{ offeringTitle }}
      </h2>
      
      <div class="flex flex-wrap items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-lg py-1 lg:py-1.5 px-2 lg:px-3 w-fit">
        <Dropdown v-model="activePeriodType" :options="periodTypeOptions" variant="minimal" />
        <span class="text-slate-300 font-light text-xs">/</span>
        <Dropdown v-model="activePeriodId" :options="periodIdOptions" variant="minimal" class="uppercase" />
      </div>
    </div>

    <div class="col-span-1 md:col-span-1 row-start-2 md:row-start-1 flex flex-col xl:flex-row justify-end items-end xl:items-center gap-1 xl:gap-5">
      
      <div class="hidden md:flex flex-col items-end text-right order-2 xl:order-1 mt-1 xl:mt-0">
        <span class="text-[11px] xl:text-[15px] font-bold text-slate-600 xl:text-slate-900 leading-none">{{ companyMeta.name }}</span>
        <span class="text-[9px] xl:text-[10px] font-bold text-slate-400 xl:text-slate-500 uppercase tracking-wider mt-0.5">Est. Users: {{ companyMeta.users }}</span>
      </div>
      
      <div class="h-10 w-px bg-slate-200 hidden xl:block order-2"></div> 

      <div class="flex flex-col items-end justify-center pt-1 order-1 xl:order-3">
        <div class="flex items-center gap-1.5 lg:gap-2">
          
          <div class="flex items-end gap-[2px] lg:gap-[3px] h-3.5 lg:h-5 cursor-pointer relative mr-1 group" @click="uiState.showPmiDetails = !uiState.showPmiDetails" title="Click to view quarterly trend">
            <div v-for="(q, idx) in pmiHistory" :key="idx" 
                 :class="['w-1 lg:w-1.5 rounded-sm transition-colors', idx === pmiHistory.length - 1 ? 'bg-slate-800' : 'bg-slate-200 group-hover:bg-slate-300']"
                 :style="{ height: `${q.percent}%` }">
            </div>
            <div v-if="uiState.showPmiDetails" class="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 flex gap-4 text-xs">
              <div v-for="(q, idx) in pmiHistory" :key="idx" class="flex flex-col items-center">
                <span class="text-slate-400 font-medium">{{ q.label }}</span>
                <span class="text-slate-900 font-bold">{{ q.score }}%</span>
              </div>
            </div>
          </div>

          <span class="text-xl lg:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">{{ pmiScore }}%</span>
          
          <span :class="['text-[11px] lg:text-sm font-bold', pmiDelta > 0 ? 'text-rose-500' : 'text-emerald-500']">
            {{ pmiDelta > 0 ? '+' : '' }}{{ pmiDelta }}%
          </span>

          <button class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer ml-0.5 lg:ml-1" @click.stop="openTwoPager('pmi')" title="View PMI 2-Pager">
            <svg class="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
        </div>
        
        <span class="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 text-right">
          Product Market Impedance
        </span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import Dropdown from '@/components/common/Dropdown.vue' // <-- IMPORTED YOUR COMPONENT

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

// --- UI STATE ---
const uiState = reactive({
  showJoyDimensions: false,
  showPmiDetails: false
})

// --- FILTER & ROUTING ORCHESTRATION ---
const isAppOffering = computed(() => route.params.offeringType === 'app' || !route.params.offeringType)

const availableSources = computed(() => {
  if (!bloomStore.countryReviewStats) return []
  return Object.keys(bloomStore.countryReviewStats)
})

const availableCountries = computed(() => {
  if (!bloomStore.countryReviewStats) return []
  const unique = new Set()
  Object.values(bloomStore.countryReviewStats).forEach(sourceMap => {
    Object.keys(sourceMap).forEach(country => unique.add(country))
  })
  return Array.from(unique).sort()
})

const updateRouteParam = (paramName, newValue) => {
  const newParams = { ...route.params, [paramName]: newValue }
  router.push({ params: newParams, query: route.query })
}

const updateQueryFilter = (queryKey, newValue) => {
  const newQuery = { ...route.query }
  if (newValue === 'all') {
    delete newQuery[queryKey]
  } else {
    newQuery[queryKey] = newValue
  }
  router.push({ query: newQuery })
}

// --- DYNAMIC DROPDOWN OPTIONS ---

// Get all blooms for the currently selected app
const currentOfferingBlooms = computed(() => {
  const directory = bloomStore.availableBloomsDirectory || {}
  const appData = directory[route.params.offeringXid]
  return appData?.blooms || []
})

// 1. Only show Period Types (Weekly, Monthly, etc) that actually exist for this app
const periodTypeOptions = computed(() => {
  const availableTypes = new Set(currentOfferingBlooms.value.map(b => b.bloomType))
  const map = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
  
  // Sort them logically (assuming you want Yearly -> Weekly order)
  const order = ['yearly', 'quarterly', 'monthly', 'weekly']
  return Array.from(availableTypes)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map(t => ({ id: t, label: map[t] || t }))
})

// 2. Only show Period IDs that match the selected Period Type
const periodIdOptions = computed(() => {
  const filtered = currentOfferingBlooms.value.filter(b => b.bloomType === route.params.periodType)
  
  return filtered.map(b => {
    let displayLabel = b.bloomKey.toUpperCase()
    
    // Optional: Add your "Week of..." parsing logic here later!
    // if (b.bloomType === 'weekly') { displayLabel = formatISOWeek(b.bloomKey) }
    
    return {
      id: b.bloomKey,
      label: displayLabel
    }
  }).sort((a, b) => b.id.localeCompare(a.id)) // Sorts newest first (e.g., 2026Q1 before 2025Q4)
})

const activePeriodType = computed({
  get: () => {
    // 1. Trust the URL first
    if (route.params.periodType) return route.params.periodType
    // 2. Fallback to the best available type in our dynamic list
    return periodTypeOptions.value[0]?.id || 'quarterly'
  },
  set: (newType) => {
    // Critical Fix: When switching types (e.g., Quarter -> Week), 
    // we MUST find a valid ID for the new type so we don't break the URL.
    const bloomsForNewType = currentOfferingBlooms.value
      .filter(b => b.bloomType === newType)
      .sort((a, b) => b.bloomKey.localeCompare(a.bloomKey)) // Sort newest first
    
    const latestValidId = bloomsForNewType[0]?.bloomKey || 'latest'

    router.push({
      params: { ...route.params, periodType: newType, periodId: latestValidId },
      query: route.query
    })
  }
})

const activePeriodId = computed({
  get: () => {
    if (route.params.periodId) return route.params.periodId
    return periodIdOptions.value[0]?.id || ''
  },
  set: (val) => updateRouteParam('periodId', val)
})

// --- UTILITIES & FORMATTERS ---
const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)
const formatCompact = (num) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(num || 0)

const formatSource = (src) => {
  if (src === 'apple_app_store') return 'App Store'
  if (src === 'google_play') return 'Google Play'
  return src
}

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

const openTwoPager = (type) => console.log(`Routing to ${type} 2-pager...`)

// --- DYNAMIC JOY DATA ---
const joyScore = computed(() => {
  const score = bloomStore.joyStats?.score
  return typeof score === 'number' ? score.toFixed(2) : '0.00'
})

const joyLabel = computed(() => bloomStore.joyStats?.scoreDescription || 'Loading...')
const joyEmoji = computed(() => getEmoji(joyLabel.value))

const formattedInteractions = computed(() => formatNumber(bloomStore.joyStats?.metrics?.reviewsAnalyzed))

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

// --- CONTEXT & META DATA ---
const offeringTitle = computed(() => bloomStore.offeringContext?.name || 'Loading...')
const companyMeta = computed(() => ({
  name: bloomStore.offeringContext?.developer?.name || 'Unknown Developer',
  users: bloomStore.offeringContext?.installs ? formatCompact(bloomStore.offeringContext.installs) : 'Unknown'
}))

// --- MOCKED PMI DATA ---
const pmiScore = ref(3.2)
const pmiDelta = ref(+0.4)
const pmiHistory = ref([
  { label: '25Q2', score: 2.1, percent: 40 },
  { label: '25Q3', score: 2.5, percent: 60 },
  { label: '25Q4', score: 2.8, percent: 50 },
  { label: '26Q1', score: 3.2, percent: 80 }
])
</script>