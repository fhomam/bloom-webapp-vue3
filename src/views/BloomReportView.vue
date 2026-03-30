<template>
  <div class="bg-slate-50 min-h-screen pb-20">
    
    <div v-if="bloomStore.currentBloom" class="flex flex-col">
      
      <ReportRibbon />  

      <div class="sticky top-0 z-10 flex flex-col bg-white border-b border-slate-200">
        
        <div 
          class="grid bg-slate-50"
          style="transition: grid-template-rows 300ms ease-in-out, opacity 300ms ease-in-out;"
          :class="isScrolled ? 'grid-rows-[1fr] opacity-100 border-b border-slate-200' : 'grid-rows-[0fr] opacity-0 border-b-0'"
        >
          <div class="overflow-hidden">
            <div class="px-6 lg:px-10 py-2.5 flex items-center justify-between">
              
              <div class="flex flex-wrap items-center gap-3 text-[13px] font-medium text-slate-600">
                <span class="font-bold text-slate-900">{{ appName }}</span>
                <span class="text-slate-300 hidden sm:inline">|</span>
                <span class="font-bold uppercase">{{ activePeriodLabel }}</span>
                <span class="text-slate-300 hidden sm:inline">|</span>
                <span>{{ formatNumber(bloomStore.joyStats?.metrics?.reviewsAnalyzed) }} Reviews</span>
                <span class="text-slate-300 hidden sm:inline">|</span>
                <span class="font-bold text-bloom-primary">{{ formatNumber(filteredIssues.length) }} Issues</span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-sm">🎉</span>
                <span class="text-[15px] font-black text-slate-900 tracking-tighter">{{ safeJoyScore }}</span>
              </div>

            </div>
          </div>
        </div>

        <div class="px-6 lg:px-10 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="relative flex-1 max-w-2xl">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input v-model="searchQuery" @input="updateSearch" type="text" placeholder="Search keywords..." class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-bloom-primary focus:ring-1 focus:ring-bloom-primary/10 rounded-lg text-[14px] transition-all outline-none" />
          </div>
          
          <div class="flex flex-wrap items-center gap-5">
            <button v-if="hasActiveFilters" @click="clearFilters" class="text-[13px] font-medium text-slate-400 hover:text-rose-500 transition-colors">
              Clear Filters
            </button>
            
            <div class="flex items-center gap-4">
              <Dropdown v-model="activeTheme" :options="themeOptions" variant="minimal" prefix="Theme:" />
              <div class="w-px h-4 bg-slate-300 hidden md:block"></div>
              <Dropdown v-model="activeSort" :options="sortOptions" variant="minimal" prefix="Sort by:" />
            </div>
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

import ReportRibbon from '@/components/bloom/ReportRibbon.vue'
import IssueCard from '@/components/bloom/IssueCard.vue'
import Dropdown from '@/components/common/Dropdown.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()
const ui = useUiStore()

// --- UTILITIES ---
const formatNumber = (num) => (num || 0).toLocaleString('en-US')
const appName = computed(() => bloomStore.offeringContext?.name || 'Loading...')
const safeJoyScore = computed(() => {
  const score = bloomStore.joyStats?.score;
  return (typeof score === 'number' ? score : 0).toFixed(2);
})

// Map the period ID back to a readable label for the sticky bar
const activePeriodLabel = computed(() => {
  const p = route.query.period || '2026q1'
  return p === '2026q1' ? '2026Q1' : p === '2025q4' ? '2025Q4' : '2025'
})

// --- FILTER & SEARCH LOGIC ---
const filteredIssues = computed(() => bloomStore.getFilteredAndSortedIssues(route.query))
const searchQuery = ref(route.query.search || '')
const updateSearch = debounce(() => {
  const query = { ...route.query }
  if (searchQuery.value) query.search = searchQuery.value
  else delete query.search
  router.push({ query })
}, 300)

const hasActiveFilters = computed(() => Object.keys(route.query).length > 0)
const clearFilters = () => {
  searchQuery.value = ''
  router.push({ query: {} })
}

// --- URL BINDINGS & OPTIONS ---
const createUrlModel = (key, defaultVal) => computed({
  get: () => route.query[key] || defaultVal,
  set: (val) => {
    const query = { ...route.query }
    if (val === defaultVal) delete query[key]
    else query[key] = val
    router.push({ query })
  }
})

const activeTheme = createUrlModel('theme', 'all')
const activeSort = createUrlModel('sort', 'most-reviews')

const sortOptions = [
  { id: 'most-reviews', label: 'Most Reviews' }, 
  { id: 'most-upvoted', label: 'Most Upvoted' }, 
  { id: 'newest-reviews', label: 'Newest' }
]

const themeOptions = computed(() => [
  { id: 'all', label: 'All Themes' }, 
  ...(bloomStore.themes?.map(t => ({ id: t.themeId, label: t.name })) || [])
])

// --- SCROLL TRACKING (Brute-Force Native Listener) ---
const isScrolled = ref(false)
let scrollContainer = null

const handleScroll = () => {
  if (scrollContainer) {
    // Trigger EXACTLY when the dynamic ribbon scrolls out of view (fallback to 150 if 0)
    const threshold = ui.reportRibbonHeight > 0 ? ui.reportRibbonHeight : 150
    isScrolled.value = scrollContainer.scrollTop > threshold
  }
}

// --- MOUNT ROUTINE ---
onMounted(async () => {
  // 1. Grab the actual scrolling container from AppLayout.vue
  scrollContainer = document.querySelector('main')
  
  if (scrollContainer) {
    // 2. Attach the raw scroll listener
    scrollContainer.addEventListener('scroll', handleScroll)
    // 3. Fire it once immediately just in case they load halfway down the page
    handleScroll()
  }

  // Sidebar defaults to closed
  ui.configureRightSidebar([{ id: 'taxo', label: 'Taxonomy', icon: '' }], 'taxo', false)
  
  try {
    if (!bloomStore.currentBloom) {
      await bloomStore.loadReportData({ orgId: 'org_1', offeringXid: 'r.hilton.hhonors', bloomKey: '2026q1', bloomType: 'quarterly' })
    }
  } catch (err) {
    console.error("Bloom Data failed to load:", err)
  }
})

onUnmounted(() => {
  // Clean up the listener so we don't cause memory leaks when routing away
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>