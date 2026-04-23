<template>
  <div class="px-6 pb-6 pt-2 lg:px-8 lg:pb-8 lg:pt-4 max-w-[1600px] mx-auto w-full flex flex-col gap-4">

    <div class="flex items-center justify-between h-8 px-1">
      
      <div class="flex flex-wrap items-center gap-2 sm:gap-4">
        <span class="hidden sm:inline text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Channel Scope</span>
        <div class="hidden sm:block w-px h-3 bg-slate-300"></div>
        
        <Dropdown v-model="activeSource" :options="sourceOptions" variant="minimal" prefix="Source:" />
        
        <template v-if="activeSource !== 'all'">
          <div class="w-px h-3 bg-slate-300"></div> 
          <Dropdown v-model="activeSecondary" :options="secondaryOptions" variant="minimal" :prefix="secondaryPrefix" />
        </template>
      </div>

      <div class="flex items-center gap-3">
        <button class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-bloom-primary transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          Share
        </button>
      </div>

    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DashboardRibbon class="col-span-1 lg:col-span-3" />
      <div class="col-span-1 lg:col-span-2"><ExecutiveSummaryStats /></div>
      <div class="col-span-1 lg:col-span-1"><TopTaxonomyWidget /></div>      
      <div class="col-span-1 lg:col-span-3"><PrimaryTrendChart /></div>
      <div class="col-span-1 lg:col-span-3"><TopIssuesHighlights /></div>
      <div class="col-span-1 lg:col-span-3"><JoySparklinesList /></div>
      <div class="col-span-1 lg:col-span-3"><SourceBreakdownRow /></div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import { useUiStore } from '@/stores/ui'

// Components
import Dropdown from '@/components/common/Dropdown.vue'
import DashboardRibbon from '@/components/dashboard/DashboardRibbon.vue'
import PrimaryTrendChart from '@/components/dashboard/PrimaryTrendChart.vue'
import JoySparklinesList from '@/components/dashboard/JoySparklinesList.vue'
import ExecutiveSummaryStats from '@/components/dashboard/ExecutiveSummaryStats.vue'
import TopTaxonomyWidget from '@/components/dashboard/TopTaxonomyWidget.vue'
import TopIssuesHighlights from '@/components/dashboard/TopIssuesHighlights.vue'
import SourceBreakdownRow from '@/components/dashboard/SourceBreakdownRow.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()
const ui = useUiStore()

// --- FILTER & ROUTING ORCHESTRATION ---
const formatSource = (src) => {
  if (src === 'apple_app_store') return 'App Store'
  if (src === 'google_play') return 'Google Play'
  return src
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

// 1. Primary Source Filter
const activeSource = computed({
  get: () => route.query.srcId || 'all',
  set: (val) => {
    const newQuery = { ...route.query }
    if (val === 'all') delete newQuery.srcId
    else newQuery.srcId = val
    
    // 🔥 SAFEGUARD: Clear contextual filters when swapping sources
    delete newQuery.country
    delete newQuery.lang
    
    router.push({ query: newQuery })
  }
})

// 2. Contextual Secondary Filter (Handles both Country and Lang)
const activeSecondary = computed({
  get: () => {
    if (activeSource.value === 'apple_app_store') return route.query.country || 'all'
    if (activeSource.value === 'google_play') return route.query.lang || 'all'
    return 'all'
  },
  set: (val) => {
    if (activeSource.value === 'apple_app_store') updateQueryFilter('country', val)
    if (activeSource.value === 'google_play') updateQueryFilter('lang', val)
  }
})

// Dynamic Label based on active source
const secondaryPrefix = computed(() => activeSource.value === 'google_play' ? 'Language:' : 'Country:')

// --- DYNAMIC OPTIONS GENERATION ---
const sourceOptions = computed(() => {
  const opts = [{ id: 'all', label: 'All' }]
  if (bloomStore.sourceInteractionStats) {
    Object.keys(bloomStore.sourceInteractionStats).forEach(src => {
      opts.push({ id: src, label: formatSource(src) })
    })
  }
  return opts
})

const secondaryOptions = computed(() => {
  const opts = [{ id: 'all', label: 'All' }]
  
  const sourceStats = bloomStore.sourceInteractionStats?.[activeSource.value]
  if (!sourceStats) return opts

  let targetDimensionStats = {}
  if (activeSource.value === 'apple_app_store') {
    targetDimensionStats = sourceStats.country || {}
  } else if (activeSource.value === 'google_play') {
    targetDimensionStats = sourceStats.lang || {}
  }

  // Generate options from the mapped dictionary
  Object.keys(targetDimensionStats).sort().forEach(code => {
    if (code !== 'global' && code !== 'default') {
      opts.push({ id: code, label: code.toUpperCase() })
    }
  })
  
  return opts
})

// --- DATA LOADING & REDIRECT LOGIC ---
const loadDashboardData = async () => {
  if (route.params.offeringXid && route.params.periodId) {
    await bloomStore.loadDashboardData({ 
      orgId: route.params.orgXid, 
      offeringXid: route.params.offeringXid, 
      offeringType: route.params.offeringType,
      bloomType: route.params.periodType, 
      bloomKey: route.params.periodId,
      filters: {
        srcId: route.query.srcId,
        country: route.query.country,
        lang: route.query.lang // Include language in backend fetch
      }
    })
    return
  }

  // ... (Your auto-routing logic remains exactly the same) ...
  try {
    const bloomsObj = await bloomStore.getAvailableBlooms();
    
    if (bloomsObj && typeof bloomsObj === 'object') {
      let latestReport = null
      let latestDetails = null

      for (const [xid, offeringData] of Object.entries(bloomsObj)) {
        const reports = offeringData?.blooms || []
        for (const report of reports) {
          const reportTime = report.updatedAt ? new Date(report.updatedAt).getTime() : 0
          const latestTime = latestReport?.updatedAt ? new Date(latestReport.updatedAt).getTime() : 0
          
          if (!latestReport || reportTime > latestTime) {
            latestReport = report
            latestDetails = offeringData.details
          }
        }
      }

      if (latestReport && latestReport.bloomKey && latestDetails) {
        router.replace({
          name: 'BloomDashboard', 
          params: {
            orgXid: route.params.orgXid,
            offeringType: latestDetails.offeringType,
            offeringXid: latestDetails.offeringXid,
            periodType: latestReport.bloomType,
            periodId: latestReport.bloomKey
          }
        })
      }
    }
  } catch (err) {
    console.error("Failed to auto-route to latest dashboard:", err)
  }
}

watch(
  // Added lang to the dependency array so it hot-reloads when language changes
  () => [route.params.offeringXid, route.params.periodId, route.query.srcId, route.query.country, route.query.lang], 
  () => {
    if (route.params.offeringXid) {
      loadDashboardData()
    }
  }, 
  { deep: true }
)

onMounted(() => {
  loadDashboardData()
  ui.configureRightSidebar([], '')
})
</script>
