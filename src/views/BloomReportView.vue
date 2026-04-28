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
            v-for="(issue, index) in filteredIssues" 
            :key="issue.id" 
            :issue="issue"
            :index="index"
            :total="filteredIssues.length"
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
import { debounce } from 'lodash-es'

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

// Dynamically converts whatever periodId is in the URL (e.g. '2026q2') to uppercase
const activePeriodLabel = computed(() => {
  const pId = route.params.periodId
  return pId ? pId.toUpperCase() : ''
})

// --- FILTER & SEARCH LOGIC ---
// 1. Isolate the "real" report filters from the UI sidebar parameters
const filterSignature = computed(() => {
  const { exploreIssue, exploreEmotion, ...realFilters } = route.query
  // Stringify ensures the computed property only registers a change if the actual values change!
  return JSON.stringify(realFilters)
})

// 2. The main feed now ONLY recalculates when the filterSignature string changes
const filteredIssues = computed(() => {
  const filters = JSON.parse(filterSignature.value)
  return bloomStore.getFilteredAndSortedIssues(filters)
})

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
  // If the core routing params are missing, abort the fetch entirely
  if (!route.params.offeringXid || !route.params.periodId) return

  try {
    await bloomStore.loadReportData({ 
      orgId: route.params.orgXid,       // No hardcoded fallback
      offeringXid: route.params.offeringXid, 
      bloomType: route.params.periodType, // No hardcoded fallback
      bloomKey: route.params.periodId,    // No hardcoded fallback
      filters: route.query
    })
  } catch (err) {
    console.error("Bloom Data failed to load:", err)
  }
}

// --- SIDEBAR & TAB MANAGEMENT ---
// Pass `true` during onMounted so it knows to delay the slide-in!
const updateSidebarState = (isInitialMount = false) => {
  const hasExplore = !!route.query.exploreIssue || !!route.query.exploreEmotion
  const hasTaxo = !!route.query.taxo

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

  ui.rightTabs = tabs

  // 1. Determine URL Precedence
  let targetTab = hasExplore ? 'interactions' : (hasTaxo ? 'taxonomy' : 'taxonomy')

  if (isInitialMount) {
    // 2. DIRECT URL LOAD: Wait for the main dashboard to finish rendering, then slide in gracefully.
    if (hasExplore || hasTaxo) {
      setTimeout(() => {
        ui.activeRightTab = targetTab
        ui.isRightOpen = true
      }, 400) // This 400ms delay completely cures the direct-URL boot hiccup
    } else {
      ui.activeRightTab = targetTab
    }
  } else {
    // 3. NORMAL NAVIGATION: Just sync the active tab based on the URL.
    // Notice we DO NOT touch ui.isRightOpen here. navigateWithGrace handles opening.
    // This allows the "Close" button to actually keep the sidebar closed!
    ui.activeRightTab = targetTab
  }
}

// --- LIFECYCLE & WATCHERS ---

// Watch the route parameters AND the query parameters. 
// Watcher 1: Data Engine
// ONLY fires if the app, period, or actual report filters change. 
// Completely ignores exploreIssue/exploreEmotion!
watch(
  () => [route.params.offeringXid, route.params.periodId, filterSignature.value], 
  () => { 
    loadDataIfNeeded()
  }
)

// Watcher 2: Sidebar UI Engine
watch(
  () => [route.query.exploreIssue, route.query.exploreEmotion, route.query.taxo],
  ([newIssue, newEmotion, newTaxo], [oldIssue, oldEmotion, oldTaxo]) => {
    
    const issueChanged = newIssue !== oldIssue
    const emotionChanged = newEmotion !== oldEmotion
    const taxoChanged = newTaxo !== oldTaxo

    // 1. If they clicked an Issue or Emotion, open the Interactions tab
    if (issueChanged || emotionChanged) {
      if (newIssue || newEmotion) {
        ui.activeRightTab = 'interactions'
        ui.isRightOpen = true
      }
    } 
    // 2. If they clicked a Taxonomy item, open the Taxonomy tab
    else if (taxoChanged) {
      if (newTaxo) {
        ui.activeRightTab = 'taxonomy'
        ui.isRightOpen = true
      }
    }
  }
)

// --- MOUNT ROUTINE ---
onMounted(() => {
  scrollContainer = document.querySelector('main')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()
  }
  
  loadDataIfNeeded()

  // True = Initial mount (Triggers the 400ms delayed smooth open)
  updateSidebarState(true) 

  // If Pinia already has the sidebar open from a previous visit, skip the animation delay!
  if (ui.isRightOpen) {
    updateSidebarState(false) // Run without the initialMount delay
  } else {
    updateSidebarState(true)  // Run with the 400ms boot sequence
  }  
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