<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden min-w-[320px]">
    
    <aside 
      :class="[
        ui.isLeftCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64',
        'absolute md:relative inset-y-0 left-0 flex flex-col bg-slate-950 text-slate-400 border-r border-slate-800 transition-all duration-300 ease-in-out z-50 shrink-0'
      ]"
    >
      <div class="h-14 flex items-center justify-between md:justify-center px-4 md:px-0 border-b border-slate-800 shrink-0">
        <div class="w-8 h-8 rounded bg-bloom-primary flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer hover:bg-bloom-mono transition-colors" @click="ui.isLeftCollapsed = !ui.isLeftCollapsed">
          B
        </div>
        <button @click="ui.isLeftCollapsed = true" class="md:hidden text-slate-400 hover:text-white">✕</button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 hide-scrollbar">
        <RouterLink to="/" class="group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" active-class="bg-slate-800 text-white">
          <DashboardIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Dashboard</span>
        </RouterLink>
        
        <RouterLink :to="latestReportRoute" class="group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" active-class="bg-slate-800 text-white">
          <ReportIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Latest Report</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
      
      <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 w-full relative">
        <div class="flex items-center gap-3">
          <button @click="ui.isLeftCollapsed = false" class="md:hidden text-slate-500 hover:text-slate-900 mr-2">☰</button>
          
          <Dropdown 
            v-if="availableOfferings.length > 0" 
            v-model="activeOffering" 
            :options="availableOfferings" 
            variant="minimal" 
            class="font-semibold text-slate-800 -ml-2"
          />
          <span v-else-if="route.params.offeringXid" class="text-sm font-semibold text-slate-500 animate-pulse">Loading...</span>
        </div>
        
        <div class="flex items-center gap-4">
          <button v-if="ui.rightTabs.length > 0" @click="ui.isRightOpen = !ui.isRightOpen" :class="['p-1.5 rounded-md transition-colors', ui.isRightOpen ? 'bg-bloom-primary text-white' : 'text-slate-400 hover:bg-slate-100']">
            <PanelIcon class="w-5 h-5" />
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden relative">
        <main class="flex-1 overflow-y-auto hide-scrollbar">
          <RouterView />
        </main>

        <div v-if="ui.isRightOpen" @click="ui.isRightOpen = false" class="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-sm"></div>
        
        <aside 
          :class="[
            ui.isRightOpen ? 'translate-x-0' : 'translate-x-full lg:w-0',
            'fixed lg:static inset-y-0 right-0 w-80 lg:border-l bg-slate-50 border-slate-200 transition-all duration-300 ease-in-out shrink-0 flex flex-col overflow-hidden z-40 shadow-2xl lg:shadow-none'
          ]"
        >
          <div class="flex border-b border-slate-200 shrink-0 min-w-[320px] bg-white">
            <button v-for="tab in ui.rightTabs" :key="tab.id" @click="ui.activeRightTab = tab.id" :class="['flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2', ui.activeRightTab === tab.id ? 'text-bloom-primary border-b-2 border-bloom-primary' : 'text-slate-500 hover:text-slate-800']">
              <span v-if="tab.icon" v-html="tab.icon" class="w-4 h-4"></span>
              {{ tab.label }}
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-4 hide-scrollbar min-w-[320px]">
            <TaxonomyTree v-if="ui.activeRightTab === 'taxonomy' && route.name === 'BloomReport'" />
            
            <div v-else class="text-sm text-slate-500">
              Currently viewing: <strong class="text-slate-800">{{ ui.activeRightTab }}</strong> panel.
            </div>
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import Dropdown from '@/components/common/Dropdown.vue'
import * as api from '@/services/api' 

// Extracted Icons
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import ReportIcon from '@/components/icons/ReportIcon.vue'
import PanelIcon from '@/components/icons/PanelIcon.vue'
import TaxonomyTree from '@/components/bloom/TaxonomyTree.vue'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const availableOfferings = ref([])
const latestReportRoute = ref('/') // Fallback route until data loads

// NEW: Session Memory & Full Data Reference
const fullBloomsData = ref({}) 
const lastVisitedMap = ref({}) // e.g., { 'r.hilton.hhonors': { pType: 'quarterly', pId: '2026q1' } }

// Silently track the active period AND filters for each offering
watch(
  () => [route.params.offeringXid, route.params.periodType, route.params.periodId, route.query],
  ([xid, pType, pId, currentQuery]) => {
    if (xid && pType && pId) {
      // Use spread operator to clone the query object so we don't accidentally mutate by reference
      lastVisitedMap.value[xid] = { pType, pId, query: { ...currentQuery } }
    }
  },
  { immediate: true, deep: true }
)

const activeOffering = computed({
  get: () => route.params.offeringXid || '',
  set: (newXid) => {
    if (!newXid || newXid === route.params.offeringXid) return
    
    // 1. Establish the target context for the newly selected offering
    let targetType = 'quarterly'
    let targetId = '2026q1'
    let targetOfferingType = 'app'
    let targetQuery = {} 

    const history = lastVisitedMap.value[newXid]
    
    if (history) {
      // Restore their exact session for this app
      targetType = history.pType
      targetId = history.pId
      targetQuery = history.query || {} 
    } else {
      const offeringData = fullBloomsData.value[newXid]
      if (offeringData) {
        targetOfferingType = offeringData.details?.offeringType || 'app'
        const blooms = offeringData.blooms || []
        if (blooms.length > 0) {
          const latest = [...blooms].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
          targetType = latest.bloomType
          targetId = latest.bloomKey
        }
      }
    }

    // 2. Determine target route (Stay where they are, unless they are on the root '/')
    const isRoot = !route.name || route.name === 'home'
    const targetRouteName = isRoot ? 'BloomDashboard' : route.name

    // 3. Smart Parameter Merging
    // We copy the existing route parameters so we don't break the current view
    const newParams = { ...route.params }
    
    // Always update the offering context
    newParams.offeringXid = newXid
    
    // Only update offeringType if the current route uses it (or if we are redirecting from root)
    if (newParams.offeringType !== undefined || isRoot) {
      newParams.offeringType = targetOfferingType
    }
    
    // Only update period details if the current view ACTUALLY cares about periods
    // (Prevents Vue Router from throwing missing param warnings on pages like Settings)
    if (newParams.periodId !== undefined || isRoot) {
      newParams.periodType = targetType
      newParams.periodId = targetId
    }

    // Ensure org exists if redirecting from root
    if (isRoot && !newParams.orgXid) {
      newParams.orgXid = 'org_1' 
    }

    // 4. Execute the seamless transition
    router.push({
      name: targetRouteName,
      params: newParams,
      query: targetQuery
    })
  }
})

onMounted(async () => {
  try {
    const rawResponse = await api.getAvailableBlooms()
    const bloomsObj = rawResponse?.data?.value || rawResponse?.value || rawResponse
    
    if (bloomsObj && typeof bloomsObj === 'object') {
      
      // Save the raw dictionary so our setter can calculate "latest" later
      fullBloomsData.value = bloomsObj 

      // 1. Populate Dropdown Options
      availableOfferings.value = Object.keys(bloomsObj).map(xid => {
        const offering = bloomsObj[xid]
        const appName = offering?.details?.name
        return {
          id: xid, 
          label: appName ? `${appName} (${xid})` : xid 
        }
      })

      // 2. Find the absolute latest report globally to power the Left Nav link
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

      // Construct global "Latest" route
      if (latestReport && latestDetails) {
        const org = route.params.orgXid || 'org_1'
        const type = latestDetails.offeringType || 'app'
        const xid = latestDetails.offeringXid
        const pType = latestReport.bloomType || 'quarterly'
        const pId = latestReport.bloomKey || '2026q1'
        
        latestReportRoute.value = `/${org}/reports/${type}/${xid}/${pType}/${pId}`
      }
    }
  } catch (err) {
    console.error("Failed to load available offerings", err)
  }
})
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>
