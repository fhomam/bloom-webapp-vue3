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
          
          <div class="flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-slate-500">
            <Dropdown v-model="activePeriod" :options="periodOptions" variant="minimal" />
            <span class="text-slate-300">•</span>
            <span>{{ safeReviewsAnalyzed }} interactions</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center w-1/3 text-center">
        <h1 class="text-2xl lg:text-[25px] font-bold text-slate-900 tracking-tight leading-none">{{ appName }}</h1>
        <div class="mt-2.5">
          <Dropdown v-model="activeClass" :options="classOptions" variant="minimal" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 lg:gap-5 w-1/3 shrink-0">
        <div v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" :key="m" class="flex flex-col items-center w-10">
          <span class="text-[22px] leading-none">{{ getEmoji(m) }}</span>
          <span class="text-[13px] font-medium text-slate-600 mt-2">{{ getJoyPercent(m) }}</span>
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
            <div class="flex items-center justify-end gap-1.5 mt-1.5 text-[12px] font-medium text-slate-500">
              <span>{{ safeReviewsAnalyzed }} interactions</span>
              <span class="text-slate-300">•</span>
              <Dropdown v-model="activePeriod" :options="periodOptions" variant="minimal" />
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
        <div class="flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
          <Dropdown v-model="activePeriod" :options="periodOptions" variant="minimal" class="text-slate-600 font-bold" />
          <span class="text-slate-300">•</span>
          <span class="truncate">{{ safeReviewsAnalyzed }} interactions</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
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
        <div v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" :key="m" class="flex flex-col items-center w-8">
          <span class="text-[22px] leading-none">{{ getEmoji(m) }}</span>
          <span class="text-[13px] font-medium text-slate-600 mt-2">{{ getJoyPercent(m) }}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-end w-full sm:w-auto sm:ml-auto gap-3">
        <Dropdown v-model="activeSource" :options="sourceOptions" variant="boxed" />
        <Dropdown v-model="activeCountry" :options="countryOptions" variant="boxed" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue' // Add ref, onMounted, onUnmounted
import { useUiStore } from '@/stores/ui' // Import the UI store

import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import Dropdown from '@/components/common/Dropdown.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

const ui = useUiStore()
const ribbonRef = ref(null)
let resizeObserver = null

onMounted(() => {
  // Watch the ribbon. Any time it changes size (or loads), update the store!
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

// --- UTILITIES & SAFE DATA MAPPING ---
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

const activePeriodLabel = computed(() => {
  const p = route.query.period || '2026q1'
  return p === '2026q1' ? '2026Q1' : p === '2025q4' ? '2025Q4' : '2025'
})

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
const activePeriod = createUrlModel('period', '2026q1') 
const activeSource = createUrlModel('srcId', 'all')
const activeCountry = createUrlModel('country', 'all')

// --- DROPDOWN OPTIONS ---
const periodOptions = [
  { id: '2026q1', label: '2026Q1' },
  { id: '2025q4', label: '2025Q4' },
  { id: '2025', label: '2025 (Yearly)' }
]

const classOptions = [
  { id: 'all', label: 'All Issues' }, 
  { id: 'backlog', label: 'Backlog Candidates' }, 
  { id: 'general', label: 'General Feedback' }
]

const sourceOptions = computed(() => [
  { id: 'all', label: 'All Sources', subLabel: 'Platforms' }, 
  ...(bloomStore.sourcesWithVersion?.apple_app_store ? [{id:'appstore', label:'App Store', subLabel: '6.27.0'}] : []), 
  ...(bloomStore.sourcesWithVersion?.google_play ? [{id:'gplay', label:'Google Play', subLabel: 'Version'}] : [])
])

const countryOptions = [
  { id: 'all', label: 'All', subLabel: 'Countries' },
  { id: 'CA', label: 'CA', subLabel: '78 reviews' },
  { id: 'US', label: 'US', subLabel: '142 reviews' }
]
</script>