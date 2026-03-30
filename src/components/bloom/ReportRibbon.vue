<template>
  <div class="bg-white border-b border-slate-200/60 w-full relative z-30">
    <div class="px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
      
      <div class="flex items-start gap-4 w-full md:w-1/3 justify-start shrink-0">
        <span class="text-4xl md:text-5xl mt-1">🎉</span>
        <div class="flex flex-col">
          <span class="text-3xl md:text-4xl font-black text-slate-900 leading-none tracking-tighter">{{ safeJoyScore }}</span>
          <span class="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1.5 leading-tight">
            {{ bloomStore.joyStats?.scoreDescription || 'Mostly Frustrated' }}
          </span>
          
          <div class="flex items-center gap-1.5 mt-2 text-[12.5px] font-medium text-slate-500">
            <Dropdown v-model="activePeriod" :options="periodOptions" variant="minimal" />
            <span class="text-slate-300">•</span>
            <span>{{ safeReviewsAnalyzed }} interactions</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center justify-center w-full md:w-1/3 text-center">
        <h1 class="text-2xl md:text-[25px] font-bold text-slate-900 tracking-tight leading-none">{{ appName }}</h1>
        <div class="mt-2.5">
          <Dropdown v-model="activeClass" :options="classOptions" variant="minimal" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 md:gap-5 w-full md:w-1/3 shrink-0">
        <div v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" :key="m" class="flex flex-col items-center w-10">
          <span class="text-[22px] leading-none">{{ getEmoji(m) }}</span>
          <span class="text-[13px] font-medium text-slate-600 mt-2">{{ getJoyPercent(m) }}</span>
        </div>
      </div>
    </div>

    <div class="px-6 lg:px-10 py-3 border-t border-slate-50 flex flex-wrap items-center justify-between bg-slate-50/30 gap-4">
      <div class="hidden md:flex gap-6 text-[13px] font-medium text-slate-500">
        <span class="truncate max-w-[200px]">{{ developerName }}</span>
        <span class="flex items-center gap-1"><span class="text-amber-400">★</span> <b class="text-slate-700">{{ safeRatingScore }}</b> ({{ safeRatingCount }})</span>
      </div>
      
      <div class="flex items-center gap-3 ml-auto md:ml-0">
        <Dropdown v-model="activeSource" :options="sourceOptions" variant="boxed" />
        <Dropdown v-model="activeCountry" :options="countryOptions" variant="boxed" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import Dropdown from '@/components/common/Dropdown.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

// --- UTILITIES & SAFE DATA MAPPING ---
const getEmoji = (m) => ({ joy:'✨', confidence:'😎', engagement:'👀', frustration:'😤', hopelessness:'😔' }[m])
const formatNumber = (num) => (num || 0).toLocaleString('en-US')

const safeJoyScore = computed(() => {
  const score = bloomStore.joyStats?.score;
  return (typeof score === 'number' ? score : 0).toFixed(2);
})

const safeReviewsAnalyzed = computed(() => {
  // Using a shorthand 'k' formatter for interactions if desired, or standard formatting
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
const activePeriod = createUrlModel('period', '2026q1') // Added period routing
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