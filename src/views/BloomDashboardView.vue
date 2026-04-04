<template>
  <div class="px-6 pb-6 pt-2 lg:px-8 lg:pb-8 lg:pt-4 max-w-[1600px] mx-auto w-full flex flex-col gap-4">

    <div class="flex items-center justify-between h-8 px-1">
      
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Global Scope</span>
        <div class="w-px h-3 bg-slate-300"></div>
        <Dropdown v-model="filters.source" :options="filterOptions.source" variant="minimal" prefix="Source:" />
        <div class="w-px h-3 bg-slate-300"></div>
        <Dropdown v-model="filters.country" :options="filterOptions.country" variant="minimal" prefix="Country:" />
      </div>

      <div class="flex items-center gap-3">
        <button class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-bloom-primary transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          Share
        </button>
      </div>

    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DashboardCommandRibbon class="col-span-1 lg:col-span-3" />
      
      <div class="col-span-1 lg:col-span-2">
        <ExecutiveSummaryStats />
      </div>

      <div class="col-span-1 lg:col-span-1">
        <TopTaxonomyWidget />
      </div>      

      <div class="col-span-1 lg:col-span-3">
        <PrimaryTrendChart />
      </div>

      <div class="col-span-1 lg:col-span-3">
        <TopIssuesHighlights />
      </div>

      <div class="col-span-1 lg:col-span-3">
        <JoySparklinesList />
      </div>

      <div class="col-span-1 lg:col-span-3">
        <SourceBreakdownRow />
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import * as api from '@/services/api' // Required for the base route redirect
import { useUiStore } from '@/stores/ui'

// Components
import Dropdown from '@/components/common/Dropdown.vue'
import DashboardCommandRibbon from '@/components/dashboard/DashboardCommandRibbon.vue'
import PrimaryTrendChart from '@/components/dashboard/PrimaryTrendChart.vue'
import JoySparklinesList from '@/components/dashboard/JoySparklinesList.vue'
import ExecutiveSummaryStats from '@/components/dashboard/ExecutiveSummaryStats.vue'
import TopTaxonomyWidget from '@/components/dashboard/TopTaxonomyWidget.vue'
import TopIssuesHighlights from '@/components/dashboard/TopIssuesHighlights.vue'
import SourceBreakdownRow from '@/components/dashboard/SourceBreakdownRow.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

// Initialize the store
const ui = useUiStore()

// Global Filter State
const filters = reactive({
  source: 'all',
  country: 'all'
})

const filterOptions = {
  source: [{ id: 'all', label: 'All' }, { id: 'apple', label: 'App Store' }, { id: 'google', label: 'Google Play' }],
  country: [{ id: 'all', label: 'All' }, { id: 'us', label: 'United States' }, { id: 'gb', label: 'United Kingdom' }]
}

// --- DATA LOADING & REDIRECT LOGIC ---
const loadDashboardData = async () => {
  // SCENARIO A: URL has parameters, fetch the data directly
  if (route.params.offeringXid && route.params.periodId) {
    // Note: Make sure `loadDashboardData` is implemented in your bloom.js store!
    await bloomStore.loadDashboardData({ 
      orgId: route.params.orgXid || 'org_1', 
      offeringXid: route.params.offeringXid, 
      offeringType: route.params.offeringType || 'app',
      bloomType: route.params.periodType || 'quarterly', 
      bloomKey: route.params.periodId || '2026q1'
    })
    return
  }

  // SCENARIO B: Hit the bare root route. Find latest offering and redirect!
  try {
    const rawResponse = await api.getAvailableBlooms()
    const bloomsObj = rawResponse?.data?.value || rawResponse?.value || rawResponse
    
    if (bloomsObj && typeof bloomsObj === 'object') {
      let latestReport = null
      let latestDetails = null

      // Find the absolute newest report across all offerings
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

      // Redirect to the fully populated URL
      if (latestReport && latestDetails) {
        router.replace({
          name: 'BloomDashboard', // This must match the name in your router/index.js
          params: {
            orgXid: route.params.orgXid || 'org_1',
            offeringType: latestDetails.offeringType || 'app',
            offeringXid: latestDetails.offeringXid,
            periodType: latestReport.bloomType || 'quarterly',
            periodId: latestReport.bloomKey || '2026q1'
          }
        })
      }
    }
  } catch (err) {
    console.error("Failed to auto-route to latest dashboard:", err)
  }
}

// Re-fetch if the URL parameters change (e.g., user selects a new app in AppLayout)
watch(
  () => [route.params.offeringXid, route.params.periodId], 
  () => {
    if (route.params.offeringXid) {
      loadDashboardData()
    }
  }, 
  { deep: true }
)

onMounted(() => {
  loadDashboardData()

  // Opt-out of the sidebar for the dashboard view
  ui.configureRightSidebar([], '')
})
</script>
