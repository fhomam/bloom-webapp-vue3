<template>
  <div ref="ribbonRef" class="bg-white border-b border-slate-200/60 w-full relative z-30">
    
    <div class="hidden md:flex px-6 lg:px-10 py-6 flex-row items-center justify-between gap-6">
      
      <div class="flex items-start gap-4 w-1/3 justify-start shrink-0">
        <span class="text-4xl mt-1">🎉</span>
        <div class="flex flex-col">
          <span class="text-3xl lg:text-4xl font-black text-slate-900 leading-none tracking-tighter">{{ safeJoyScore }}</span>
          <span class="text-[11px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1.5 leading-tight">
            {{ bloomStore.joyStats?.scoreDescription || 'Mostly Frustrated' }}
          </span>
          
          <div class="flex items-center gap-1 mt-2 text-[12.5px] font-medium text-slate-500">
            <Dropdown v-model="activePeriodType" :options="periodTypeOptions" variant="minimal" class="text-slate-600 font-bold" />
            <span class="text-slate-300">/</span>
            <Dropdown v-model="activePeriodId" :options="periodIdOptions" variant="minimal" class="text-slate-800 font-bold" />
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center w-1/3 text-center">
        <h1 class="text-2xl lg:text-[25px] font-bold text-slate-900 tracking-tight leading-none">{{ appName }}</h1>
        <div class="mt-2.5">
          <Dropdown v-model="activeClass" :options="classOptions" variant="minimal" />
        </div>
      </div>

      <div class="flex flex-col items-end justify-center w-1/3 shrink-0 gap-3">
        <div class="flex items-center justify-end gap-3 lg:gap-5">
          <button 
            v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" 
            :key="m" 
            @click="openEmotionExplorer(m)"
            class="flex flex-col items-center w-10 group cursor-pointer"
          >
            <span class="text-[24px] leading-none group-hover:scale-110 transition-transform">{{ getEmoji(m) }}</span>
            <span class="text-[13px] font-medium text-slate-600 mt-2 group-hover:text-bloom-primary transition-colors">{{ getJoyPercent(m) }}</span>
          </button>
        </div>
        <div class="text-[11.5px] font-medium text-slate-400 pr-1">
          Based on {{ safeReviewsAnalyzed }} interactions
        </div>
      </div>
    </div>

    <div class="hidden sm:flex md:hidden flex-col gap-5 px-6 py-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-col items-start text-left min-w-0">
          <h1 class="text-[22px] font-bold text-slate-900 tracking-tight leading-none truncate w-full">{{ appName }}</h1>
          <div class="mt-1.5">
            <Dropdown v-model="activeClass" :options="classOptions" variant="minimal" />
          </div>
        </div>
        <div class="flex items-start justify-end shrink-0">
          <div class="flex flex-col items-end text-right">
            <div class="flex items-center gap-2">
              <span class="text-3xl">🎉</span>
              <span class="text-3xl font-black text-slate-900 leading-none tracking-tighter">{{ safeJoyScore }}</span>
            </div>
            <div class="flex items-center justify-end gap-1 mt-1.5 text-[12px] font-medium text-slate-500">
              <Dropdown v-model="activePeriodType" :options="periodTypeOptions" variant="minimal" class="text-slate-600 font-bold" />
              <span class="text-slate-300">/</span>
              <Dropdown v-model="activePeriodId" :options="periodIdOptions" variant="minimal" class="text-slate-800 font-bold" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex sm:hidden flex-col px-6 py-5 bg-white">
      <div class="flex flex-col items-center text-center min-w-0">
        <h1 class="font-bold text-slate-900 text-[19px] leading-tight truncate w-full">{{ appName }}</h1>
        <div class="mt-1">
          <Dropdown v-model="activeClass" :options="classOptions" variant="minimal" class="text-[14.5px]" />
        </div>
      </div>
      <div class="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
        <div class="flex flex-col gap-1 text-[13px] font-medium text-slate-500">
          <div class="flex items-center gap-1">
            <Dropdown v-model="activePeriodType" :options="periodTypeOptions" variant="minimal" class="text-slate-600 font-bold" />
            <span class="text-slate-300">/</span>
            <Dropdown v-model="activePeriodId" :options="periodIdOptions" variant="minimal" class="text-slate-800 font-bold" />
          </div>
          <span class="text-[11.5px] text-slate-400 truncate">Based on {{ safeReviewsAnalyzed }} interactions</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 self-start mt-1">
          <span class="text-[22px]">🎉</span>
          <span class="text-[20px] font-black text-slate-900 tracking-tighter">{{ safeJoyScore }}</span>
        </div>
      </div>
    </div>

    <div class="px-6 lg:px-10 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 gap-4">
      
      <div class="hidden md:flex gap-6 text-[13px] font-medium text-slate-500">
        <span class="truncate max-w-[200px]">{{ developerName }}</span>
        <span class="flex items-center gap-1"><span class="text-amber-400">★</span> <b class="text-slate-700">{{ safeRatingScore }}</b> ({{ safeRatingCount }})</span>
      </div>

      <div class="hidden sm:flex md:hidden items-center gap-4 shrink-0">
        <button 
          v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" 
          :key="m" 
          @click="openEmotionExplorer(m)"
          class="flex flex-col items-center w-8 group cursor-pointer"
        >
          <span class="text-[22px] leading-none group-hover:scale-110 transition-transform">{{ getEmoji(m) }}</span>
          <span class="text-[13px] font-medium text-slate-600 mt-2 group-hover:text-bloom-primary transition-colors">{{ getJoyPercent(m) }}</span>
        </button>
        <div class="h-8 w-px bg-slate-200 mx-1"></div>
        <div class="text-[11px] font-medium text-slate-400 leading-tight">
          Based on<br/><b class="text-slate-500">{{ safeReviewsAnalyzed }}</b> interactions
        </div>
      </div>
      
      <div class="flex items-center justify-end w-full sm:w-auto sm:ml-auto gap-3">
        <Dropdown v-model="activeSource" :options="sourceOptions" variant="boxed" />
        
        <Dropdown v-if="activeSource !== 'all'" v-model="activeSecondary" :options="secondaryOptions" variant="boxed" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import Dropdown from '@/components/common/Dropdown.vue'
import * as api from '@/services/api' 

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

const ui = useUiStore()
const ribbonRef = ref(null)
let resizeObserver = null

// --- UTILITIES ---
const toTitleCase = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const formatSourceName = (key) => {
  const map = {
    'apple_app_store': 'App Store',
    'google_play': 'Google Play',
    'web': 'Web Portal'
  }
  return map[key] || toTitleCase(key.replace(/_/g, ' '))
}

// --- EXPLORATION BINDINGS ---
const openEmotionExplorer = (metric) => {
  ui.navigateWithGrace('interactions', { exploreEmotion: metric }, route, router)
}

// --- DYNAMIC BLOOM DATA ---
const availableBloomsForOffering = ref([])

const loadAvailablePeriods = async () => {
  try {
    const rawResponse = await api.getAvailableBlooms()
    const bloomsObj = rawResponse?.data?.value || rawResponse?.value || rawResponse
    
    const activeXid = route.params.offeringXid
    if (bloomsObj && bloomsObj[activeXid]) {
      availableBloomsForOffering.value = bloomsObj[activeXid].blooms || []
    }
  } catch(e) {
    console.error("Failed to load periods for ribbon", e)
  }
}

watch(() => route.params.offeringXid, () => {
  loadAvailablePeriods()
})

// --- CADENCE & PERIOD DROPDOWNS ---
const activePeriodType = computed({
  get: () => route.params.periodType || 'quarterly',
  set: (newType) => {
    if (newType === route.params.periodType) return
    
    const bloomsForType = availableBloomsForOffering.value.filter(b => b.bloomType === newType)
    let newPeriodId = route.params.periodId 
    
    if (bloomsForType.length > 0) {
      bloomsForType.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      newPeriodId = bloomsForType[0].bloomKey
    }

    router.push({
      name: 'BloomReport',
      params: { ...route.params, periodType: newType, periodId: newPeriodId },
      query: route.query
    })
  }
})

const activePeriodId = computed({
  get: () => route.params.periodId,
  set: (newId) => {
    if (newId === route.params.periodId) return
    router.push({
      name: 'BloomReport',
      params: { ...route.params, periodId: newId },
      query: route.query
    })
  }
})

const periodTypeOptions = computed(() => {
  if (!availableBloomsForOffering.value.length) {
    const fallback = route.params.periodType || 'quarterly'
    return [{ id: fallback, label: toTitleCase(fallback) }]
  }
  const types = [...new Set(availableBloomsForOffering.value.map(b => b.bloomType))]
  return types.map(t => ({ id: t, label: toTitleCase(t) }))
})

const periodIdOptions = computed(() => {
  const currentType = route.params.periodType || 'quarterly'
  const blooms = availableBloomsForOffering.value.filter(b => b.bloomType === currentType)
  
  if (!blooms.length) {
    const fallback = route.params.periodId
    return [{ id: fallback, label: fallback.toUpperCase() }]
  }

  blooms.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return blooms.map(b => ({ id: b.bloomKey, label: b.bloomKey.toUpperCase() }))
})


// --- OTHER UTILITIES & SAFE DATA MAPPING ---
const getEmoji = (m) => ({ joy:'✨', confidence:'😎', engagement:'👀', frustration:'😤', hopelessness:'😔' }[m])
const formatNumber = (num) => (num || 0).toLocaleString('en-US')

const safeJoyScore = computed(() => {
  const score = bloomStore.joyStats?.score;
  return (typeof score === 'number' ? score : 0).toFixed(2);
})

const safeReviewsAnalyzed = computed(() => {
  const count = bloomStore.joyStats?.metrics?.reviewsAnalyzed || 0;
  return count > 999 ? (count/1000).toFixed(1) + 'k' : count.toString();
})

const appName = computed(() => bloomStore.offeringContext?.name || 'Loading...')
const developerName = computed(() => bloomStore.offeringContext?.developer?.name || '')
const safeRatingScore = computed(() => {
  const score = bloomStore.offeringContext?.userRating?.averageScore;
  return (typeof score === 'number' ? score : 0).toFixed(1);
})
const safeRatingCount = computed(() => formatNumber(bloomStore.offeringContext?.userRating?.count || 0))

const getJoyPercent = (metric) => {
  if (!bloomStore.joyStats?.metrics) return '0%'
  const m = bloomStore.joyStats.metrics
  const total = (m.joy || 0) + (m.confidence || 0) + (m.engagement || 0) + (m.frustration || 0) + (m.hopelessness || 0)
  return total === 0 ? '0%' : Math.round(((m[metric] || 0) / total) * 100) + '%'
}

// --- URL BINDINGS ---
const createUrlModel = (key, defaultVal) => computed({
  get: () => route.query[key] || defaultVal,
  set: (val) => {
    const query = { ...route.query }
    if (val === defaultVal) delete query[key]
    else query[key] = val
    router.push({ query })
  }
})

const activeClass = createUrlModel('class', 'all')

// Contextual Routing Logic
const activeSource = computed({
  get: () => route.query.srcId || 'all',
  set: (val) => {
    const query = { ...route.query }
    if (val === 'all') delete query.srcId
    else query.srcId = val
    
    // Safety check: Wipe out contextual filters when source changes
    delete query.country
    delete query.lang
    router.push({ query })
  }
})

// Secondary Locale Router
const activeSecondary = computed({
  get: () => {
    if (activeSource.value === 'apple_app_store') return route.query.country || 'all'
    if (activeSource.value === 'google_play') return route.query.lang || 'all'
    return 'all'
  },
  set: (val) => {
    const query = { ...route.query }
    const key = activeSource.value === 'apple_app_store' ? 'country' : 'lang'
    if (val === 'all') delete query[key]
    else query[key] = val
    router.push({ query })
  }
})

// --- DYNAMIC DROPDOWN OPTIONS ---
const classOptions = [
  { id: 'all', label: 'All Packets' }, 
  { id: 'backlog-candidate', label: 'Backlog Candidates' }, 
  { id: 'non-actionable', label: 'General Feedback' }
]

const sourceOptions = computed(() => {
  const baseOptions = [{ id: 'all', label: 'All Sources', subLabel: 'Platforms' }]
  const versions = bloomStore.sourcesWithVersion
  
  if (!versions || typeof versions !== 'object') return baseOptions
  
  const dynamicSources = Object.keys(versions).map(sourceKey => ({
    id: sourceKey,
    label: formatSourceName(sourceKey),
    subLabel: versions[sourceKey] 
  }))
  
  return [...baseOptions, ...dynamicSources]
})

const secondaryOptions = computed(() => {
  const baseOptions = [{ id: 'all', label: 'All', subLabel: activeSource.value === 'google_play' ? 'Languages' : 'Countries' }]
  
  // 1. Grab the stats for the currently selected source from our NEW store variable
  const sourceStats = bloomStore.sourceInteractionStats?.[activeSource.value]
  if (!sourceStats) return baseOptions

  // 2. Select the correct dimension dictionary based on the source
  let targetDimensionStats = {}
  if (activeSource.value === 'apple_app_store') {
    targetDimensionStats = sourceStats.country || {}
  } else if (activeSource.value === 'google_play') {
    targetDimensionStats = sourceStats.lang || {}
  }

  // 3. Map the dictionary into dropdown options, filtering out placeholders
  const dynamicOptions = Object.entries(targetDimensionStats)
    .filter(([code]) => code !== 'global' && code !== 'default')
    .map(([code, count]) => ({
      id: code,
      label: code.toUpperCase(),
      subLabel: `${formatNumber(count)} reviews`
    }))

  return [...baseOptions, ...dynamicOptions.sort((a, b) => a.label.localeCompare(b.label))]
})

onMounted(() => {
  loadAvailablePeriods()

  resizeObserver = new ResizeObserver((entries) => {
    if (entries[0]) {
      ui.reportRibbonHeight = entries[0].contentRect.height
    }
  })

  if (ribbonRef.value) {
    resizeObserver.observe(ribbonRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
