<template>
  <div class="bg-slate-50 min-h-screen pb-20">
    
    <div v-if="bloomStore.currentBloom" class="flex flex-col">
      
      <ReportRibbon />  

      <div class="sticky top-0 z-10 flex flex-col border-b border-slate-200 anti-bleed-header">
        
        <div 
          class="grid bg-slate-50"
          style="transition: grid-template-rows 300ms ease-in-out, opacity 300ms ease-in-out;"
          :class="isScrolled ? 'grid-rows-[1fr] opacity-100 border-b border-slate-200' : 'grid-rows-[0fr] opacity-0 border-b-0'"
        >
          <div class="overflow-hidden">
            <div class="px-6 lg:px-10 py-2.5 flex items-center justify-between">
              
              <div class="flex flex-wrap items-center gap-3 text-[13px] font-medium text-slate-600">
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
        <div v-if="filteredIssues.length > 0" class="flex flex-col gap-5 pb-20">
          <IssueCard 
            v-for="issue in filteredIssues" 
            :key="issue.id" 
            :issue="issue"
          />
        </div>

        <EmptyState 
          v-else
          icon="🔍"
          title="No issues match your filters"
          message="Try selecting different sources, themes, or periods to see more data."
          :actionLabel="hasActiveFilters ? 'Clear all filters' : ''"
          @action="clearFilters"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'
import { debounce } from 'lodash'

import ReportRibbon from '@/components/bloom/ReportRibbon.vue'
import IssueCard from '@/components/bloom/IssueCard.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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

// --- DYNAMIC THEME DROPDOWN ---
const themeOptions = computed(() => {
  const baseOptions = [{ id: 'all', label: 'All Themes' }]
  
  // 1. Scan all raw issues in the current bloom to see which themes actually exist
  const activeThemeIds = new Set()
  
  if (bloomStore.allIssues) {
    bloomStore.allIssues.forEach(issue => {
      if (issue.themes && Array.isArray(issue.themes)) {
        issue.themes.forEach(t => activeThemeIds.add(t.themeId))
      }
    })
  }

  // 2. Filter the global themes list down to ONLY the ones present in this report
  const availableThemes = bloomStore.themes?.filter(t => activeThemeIds.has(t.themeId)) || []

  // 3. Map them to the Dropdown format
  const dynamicThemes = availableThemes.map(t => ({ 
    id: t.themeId, 
    label: t.name 
  }))

  return [...baseOptions, ...dynamicThemes]
})

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

// --- DYNAMIC DATA LOADING ---
const loadDataIfNeeded = async () => {
  if (!route.params.offeringXid) return

  try {
    await bloomStore.loadReportData({ 
      orgId: route.params.orgXid || 'org_1', 
      offeringXid: route.params.offeringXid, 
      bloomType: route.params.periodType || 'quarterly', 
      bloomKey: route.params.periodId || '2026q1',
      filters: route.query
    })
  } catch (err) {
    console.error("Bloom Data failed to load:", err)
  }
}

// --- SIDEBAR & TAB MANAGEMENT ---
const updateSidebarState = () => {
  const hasExplore = !!route.query.exploreIssue || !!route.query.exploreEmotion

  const tabs = [
    { 
      id: 'taxonomy', 
      label: 'Taxonomy', 
      icon: `<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="3"></circle><circle cx="19" cy="5" r="3"></circle><circle cx="19" cy="19" r="3"></circle><path d="M8 12h4"></path><path d="M12 5v14"></path><path d="M12 5h4"></path><path d="M12 19h4"></path></svg>`
    },
    {
      id: 'interactions',
      label: 'Interactions',
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>`
    }
  ]

  let activeTab = ui.activeRightTab || 'taxonomy'
  let isOpen = ui.isRightOpen // Retain the current open/closed state by default!

  if (hasExplore) {
    activeTab = 'interactions'
    isOpen = true // Only FORCE open if they specifically click a new explore link
  } else {
    // If no explore parameters exist, ensure the UI resets to taxonomy 
    // so it's ready for the next time they open it
    if (activeTab === 'interactions') {
      activeTab = 'taxonomy'
    }
  }

  ui.configureRightSidebar(tabs, activeTab, isOpen)
}

// --- LIFECYCLE & WATCHERS ---

// Watch the route parameters AND the query parameters. 
// If the app, period, OR any filter/explore state changes, trigger our updates synchronously!
watch(
() => route.fullPath, 
  () => { 
    loadDataIfNeeded()
    updateSidebarState() 
  },
  { deep: true } // Required so Vue catches inner changes to the route.query object
)

// --- MOUNT ROUTINE ---
onMounted(() => {
  // 1. Grab the actual scrolling container from AppLayout.vue
  scrollContainer = document.querySelector('main')
  
  if (scrollContainer) {
    // 2. Attach the raw scroll listener
    scrollContainer.addEventListener('scroll', handleScroll)
    // 3. Fire it once immediately just in case they load halfway down the page
    handleScroll()
  }
  
  // 4. Initial check to load data
  loadDataIfNeeded()

  // 5. Initialize the sidebar based on the URL the user landed on
  updateSidebarState()
})

onUnmounted(() => {
  // 1. Clean up the listener so we don't cause memory leaks when routing away
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }

  // 2. Clean up the sidebar when the user leaves the report!
  ui.configureRightSidebar([], '', false)
})
</script>

<style scoped>
/* PURE CSS BLEED FIX */
.anti-bleed-header {
  /* 1. Forces a solid, impenetrable white background plate */
  background-color: #ffffff;
  
  /* 2. Forces the browser to render this entire header on its own dedicated GPU layer. 
        Scrolling elements below physically cannot clip or bleed through a composited layer. */
  transform: translate3d(0, 0, 0);
  
  /* 3. Acts as "grout". A solid 1px shadow with zero blur fills in any microscopic 
        sub-pixel gaps between the DOM elements inside the header. */
  box-shadow: 0 0 0 1px #ffffff;
}
</style>