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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'
import { useBloomUrlState } from '@/composables/useBloomUrlState'
import { debounce } from 'lodash-es'

import ReportRibbon from '@/components/bloom/ReportRibbon.vue'
import IssueCard from '@/components/bloom/IssueCard.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()
const ui = useUiStore()
const urlState = useBloomUrlState()

// --- UTILITIES ---
const formatNumber = (num) => (num || 0).toLocaleString('en-US')
const safeJoyScore = computed(() => {
  const score = bloomStore.joyStats?.score
  return (typeof score === 'number' ? score : 0).toFixed(2)
})

const activePeriodLabel = computed(() => {
  const pId = route.params.periodId
  return pId ? pId.toUpperCase() : ''
})

// --- FILTER & SEARCH LOGIC ---
// UI-only params that should NOT trigger a data reload when they change.
// `taxo` is real filtering (changes the main list). `forIssue`, `panel`,
// `emotion`, `hl` are all panel-state.
const UI_ONLY_QUERY_KEYS = [
  'taxo',
  'panel',
  'emotion',
  'hl',
  'forIssue'
]

const filterSignature = computed(() => {
  const realFilters = { ...route.query }
  UI_ONLY_QUERY_KEYS.forEach((k) => delete realFilters[k])
  return JSON.stringify(realFilters)
})

// Combined signature for the data engine watcher. Returning a single
// primitive string means Vue compares with Object.is and only fires
// the watcher when the signature *actually* changes — not just when
// a dependency re-emits with the same value.
const dataLoadSignature = computed(() => {
  return [
    route.params.offeringXid || '',
    route.params.periodId || '',
    filterSignature.value,
  ].join('::')
})

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
  { id: 'most-reviews', label: 'Most Interactions' }, 
  { id: 'most-upvoted', label: 'Most Upvoted' }, 
  { id: 'newest-reviews', label: 'Newest' }
]

const themeOptions = computed(() => {
  const baseOptions = [{ id: 'all', label: 'All Themes' }]
  const activeThemeIds = new Set()
  
  if (bloomStore.allIssues) {
    bloomStore.allIssues.forEach(issue => {
      if (issue.themes && Array.isArray(issue.themes)) {
        issue.themes.forEach(t => activeThemeIds.add(t.themeId))
      }
    })
  }

  const availableThemes = bloomStore.themes?.filter(t => activeThemeIds.has(t.themeId)) || []
  const dynamicThemes = availableThemes.map(t => ({ id: t.themeId, label: t.name }))

  return [...baseOptions, ...dynamicThemes]
})

// --- SCROLL TRACKING ---
const isScrolled = ref(false)
let scrollContainer = null

const handleScroll = () => {
  if (scrollContainer) {
    const threshold = ui.reportRibbonHeight > 0 ? ui.reportRibbonHeight : 150
    isScrolled.value = scrollContainer.scrollTop > threshold
  }
}

// --- DYNAMIC DATA LOADING ---
const loadDataIfNeeded = async () => {
  if (!route.params.offeringXid || !route.params.periodId) return

  try {
    await bloomStore.loadReportData({ 
      orgId: route.params.orgXid,
      offeringXid: route.params.offeringXid, 
      bloomType: route.params.periodType,
      bloomKey: route.params.periodId,
      filters: route.query
    })
  } catch (err) {
    console.error("Bloom Data failed to load:", err)
  }
}

// ====================================================================
// SIDEBAR STATE — DERIVED FROM URL
// The URL panel param is the source of truth. ui.isRightOpen and
// ui.activeRightTab follow it.
// ====================================================================
const sidebarTabs = [
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

const syncSidebarFromUrl = () => {
  ui.rightTabs = sidebarTabs

  const panelValue = urlState.panel.value
  if (panelValue) {
    ui.activeRightTab = panelValue
    ui.isRightOpen = true
  } else {
    ui.isRightOpen = false
  }
}

// --- WATCHERS ---

// Watcher 1: Data Engine — real route + filter changes only
watch(
  dataLoadSignature,
  () => loadDataIfNeeded()
)

// Watcher 2: URL → UI State sync
watch(
  () => urlState.panel.value,
  () => syncSidebarFromUrl()
)

// --- MOUNT ROUTINE ---
onMounted(() => {
  scrollContainer = document.querySelector('main')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll()
  }

  // 1. Kick off data load.
  loadDataIfNeeded()

  // 2. Sidebar state — derive from URL. On cold load with an active
  //    panel, delay the slide-in by 400ms so the main view paints
  //    first. On warm navigations, no delay.
  ui.rightTabs = sidebarTabs
  const hasPanelOnEntry = !!urlState.panel.value

  if (hasPanelOnEntry && !ui.isRightOpen) {
    setTimeout(() => syncSidebarFromUrl(), 400)
  } else {
    syncSidebarFromUrl()
  }
})

onUnmounted(() => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
  ui.configureRightSidebar([], '', false)
})
</script>

<style scoped>
.anti-bleed-header {
  background-color: #ffffff;
  transform: translate3d(0, 0, 0);
  box-shadow: 0 0 0 1px #ffffff;
}
</style>