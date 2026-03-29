<template>
  <div class="bg-slate-50 min-h-screen pb-20">
    
    <div v-if="bloomStore.currentBloom" class="flex flex-col">
      
      <div class="bg-white border-b border-slate-200/60 w-full">
        <div class="px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div class="flex items-center gap-4 md:w-1/4 shrink-0">
            <span class="text-5xl">🎉</span>
            <div class="flex flex-col">
              <span class="text-4xl font-black text-slate-900 leading-none tracking-tighter">{{ bloomStore.joyStats?.score.toFixed(2) }}</span>
              <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1">{{ bloomStore.joyStats?.scoreDescription }}</span>
              <span class="text-[9px] text-slate-400 font-medium uppercase mt-0.5 whitespace-nowrap">vs {{ formatNumber(bloomStore.joyStats?.metrics?.reviewsAnalyzed) }} reviews</span>
            </div>
          </div>

          <div class="text-center flex-1">
            <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{{ appName }}</h1>
            <p class="text-[11px] text-slate-400 font-bold tracking-[0.3em] uppercase mt-1">2026Q1</p>
          </div>

          <div class="flex items-center justify-end gap-5 md:w-1/4 shrink-0">
            <div v-for="m in ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']" :key="m" class="flex flex-col items-center">
              <span class="text-xl leading-none">{{ getEmoji(m) }}</span>
              <span class="text-[10px] font-black text-slate-700 mt-1.5">{{ getJoyPercent(m) }}</span>
            </div>
          </div>
        </div>

        <div class="px-6 lg:px-10 py-3 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div class="hidden md:flex gap-6 text-[12px] font-medium text-slate-500">
            <span class="truncate max-w-[200px]">{{ developerName }}</span>
            <span class="flex items-center gap-1"><span class="text-amber-400">★</span> <b class="text-slate-700">{{ ratingScore }}</b> ({{ ratingCount }})</span>
            <span>{{ price }} <small>{{ currency }}</small></span>
          </div>
          
          <div class="flex items-center gap-2 ml-auto md:ml-0">
            <MinimalDropdown v-model="activeSource" :options="sourceOptions" prefix="Source:" />
            <MinimalDropdown v-model="activeCountry" :options="countryOptions" prefix="Country:" />
          </div>
        </div>
      </div>

      <div class="sticky top-0 z-50 flex flex-col bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        
        <Transition name="slide-fade">
          <div v-show="isScrolled" class="px-6 lg:px-10 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div class="flex items-center gap-3 text-xs">
              <span class="font-bold text-slate-800">{{ appName }}</span>
              <span class="text-slate-300">|</span>
              <span class="text-slate-500 font-medium">{{ formatNumber(bloomStore.joyStats?.metrics?.reviewsAnalyzed) }} Reviews</span>
              <span class="text-slate-300">|</span>
              <span class="font-black text-bloom-primary">{{ bloomStore.joyStats?.score.toFixed(2) }} Joy</span>
            </div>
            <div class="flex gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
              <span class="text-[10px] font-bold text-bloom-accent2">✨ {{ getJoyPercent('joy') }}</span>
              <span class="text-[10px] font-bold text-rose-500">😤 {{ getJoyPercent('frustration') }}</span>
            </div>
          </div>
        </Transition>

        <div class="px-6 lg:px-10 py-2.5 flex items-center justify-between gap-4">
          <div class="relative flex-1 max-w-xl">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input v-model="searchQuery" @input="updateSearch" type="text" placeholder="Search keywords..." class="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 focus:border-bloom-primary focus:ring-1 focus:ring-bloom-primary/10 rounded-lg text-sm transition-all outline-none" />
          </div>
          <div class="flex items-center gap-2">
            <MinimalDropdown v-model="activeTheme" :options="themeOptions" prefix="Theme:" />
            <div class="w-px h-4 bg-slate-200 hidden md:block"></div>
            <MinimalDropdown v-model="activeSort" :options="sortOptions" prefix="Sort:" />
          </div>
        </div>
      </div>

      <div class="w-full px-6 lg:px-10 mt-8 relative z-0">
        <div v-if="filteredIssues.length > 0" class="space-y-6">
          <IssueCard 
            v-for="(issue, index) in filteredIssues" 
            :key="issue.id"
            :issue="issue"
            :index="index"
            :total="filteredIssues.length"
          />
        </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'
import { debounce } from 'lodash'

import IssueCard from '@/components/bloom/IssueCard.vue'
import MinimalDropdown from '@/components/common/MinimalDropdown.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()
const ui = useUiStore()

// --- SCROLL TRACKING ---
const isScrolled = ref(false)
const updateScroll = () => {
  isScrolled.value = window.scrollY > 120
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  // Ensure we start with correct state
  updateScroll()
})
onUnmounted(() => window.removeEventListener('scroll', updateScroll))

// --- UTILITIES & MAPPING ---
const getEmoji = (m) => ({ joy:'✨', confidence:'😎', engagement:'👀', frustration:'😤', hopelessness:'😔' }[m])
const formatNumber = (num) => (num || 0).toLocaleString('en-US')

const getJoyPercent = (metric) => {
  if (!bloomStore.joyStats?.metrics) return '0%'
  const m = bloomStore.joyStats.metrics
  const total = m.joy + m.confidence + m.engagement + m.frustration + m.hopelessness
  return total === 0 ? '0%' : Math.round((m[metric] / total) * 100) + '%'
}

// Meta Data
const appName = computed(() => bloomStore.offeringContext?.name || 'Loading...')
const developerName = computed(() => bloomStore.offeringContext?.developer?.name || '')
const ratingScore = computed(() => bloomStore.offeringContext?.userRating?.averageScore?.toFixed(1) || '0.0')
const ratingCount = computed(() => formatNumber(bloomStore.offeringContext?.userRating?.count))
const price = computed(() => bloomStore.offeringContext?.price || 'Free')
const currency = computed(() => bloomStore.offeringContext?.currency || 'USD')

// Filter/Search Logic (Same as before, keep your current implementation)
const filteredIssues = computed(() => bloomStore.getFilteredAndSortedIssues(route.query))
const searchQuery = ref(route.query.search || '')
const updateSearch = debounce(() => {
  const query = { ...route.query }
  if (searchQuery.value) query.search = searchQuery.value
  else delete query.search
  router.push({ query })
}, 300)

// Helper for URL Sync
const createUrlModel = (key, defaultVal) => computed({
  get: () => route.query[key] || defaultVal,
  set: (val) => {
    const query = { ...route.query }
    if (val === defaultVal) delete query[key]
    else query[key] = val
    router.push({ query })
  }
})

const activeSource = createUrlModel('srcId', 'all')
const activeCountry = createUrlModel('country', 'all')
const activeTheme = createUrlModel('theme', 'all')
const activeSort = createUrlModel('sort', 'most-reviews')

// Options (Assuming themes loaded in store)
const themeOptions = computed(() => [{ id: 'all', label: 'All' }, ...(bloomStore.themes?.map(t => ({ id: t.themeId, label: t.name })) || [])])
const sortOptions = [ { id: 'most-reviews', label: 'Most Reviews' }, { id: 'most-upvoted', label: 'Most Upvoted' }, { id: 'newest-reviews', label: 'Newest' } ]
const sourceOptions = computed(() => [{ id: 'all', label: 'All' }, ...(bloomStore.sourcesWithVersion?.apple_app_store ? [{id:'appstore', label:'App Store'}] : []), ...(bloomStore.sourcesWithVersion?.google_play ? [{id:'gplay', label:'Google Play'}] : [])])
const countryOptions = [{ id: 'all', label: 'All' }] // Simplify for now

onMounted(async () => {
  ui.configureRightSidebar([{ id: 'taxo', label: 'Taxonomy', icon: '' }], 'taxo', true)
  if (!bloomStore.currentBloom) {
    await bloomStore.loadReportData({ orgId: 'org_1', offeringXid: 'r.hilton.hhonors', bloomKey: '2026q1', bloomType: 'quarterly' })
  }
})
</script>

<style scoped>
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(-10px); opacity: 0; }
</style>
