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
        <RouterLink :to="dashboardLink" class="group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" active-class="bg-slate-800 text-white">
          <DashboardIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Dashboard</span>
        </RouterLink>
        
        <RouterLink :to="reportLink" class="group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" active-class="bg-slate-800 text-white">
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
          <button 
            v-if="ui.rightTabs.length > 0 && route.name !== 'BloomDashboard'" 
            @click="ui.isRightOpen = !ui.isRightOpen" 
            :class="['p-1.5 rounded-md transition-colors', ui.isRightOpen ? 'bg-bloom-primary text-white' : 'text-slate-400 hover:bg-slate-100']"
          >
            <PanelIcon class="w-5 h-5" />
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden relative">
        <main class="flex-1 overflow-y-auto hide-scrollbar">
          <RouterView />
        </main>
        
        <aside 
          :class="[
            isSidebarEffectivelyOpen ? 'translate-x-0 lg:w-80' : 'translate-x-full lg:w-0',
            enableTransitions ? 'transition-all duration-300 ease-in-out' : '', // <-- Conditionally applied
            'fixed lg:relative inset-y-0 right-0 w-80 lg:border-l bg-slate-50 border-slate-200 shrink-0 overflow-hidden z-40 shadow-2xl lg:shadow-none'
          ]"
        >
          <div class="w-80 h-full flex flex-col bg-white">
            
            <div class="flex border-b border-slate-200 shrink-0 overflow-x-auto hide-scrollbar">
              <button v-for="tab in ui.rightTabs" :key="tab.id" @click="ui.activeRightTab = tab.id" :class="['flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2', ui.activeRightTab === tab.id ? 'text-bloom-primary border-b-2 border-bloom-primary' : 'text-slate-500 hover:text-slate-800']">
                <span v-if="tab.icon" v-html="tab.icon" class="w-4 h-4"></span>
                {{ tab.label }}
              </button>
            </div>

            <div class="flex-1 overflow-hidden flex flex-col relative bg-white">
            
              <KeepAlive>
                <TaxonomyTree v-if="ui.activeRightTab === 'taxonomy' && route.name === 'BloomReport'" class="h-full" />
              </KeepAlive>

              <KeepAlive>
                <InteractionExplorer v-if="ui.activeRightTab === 'interactions'" class="h-full" />
              </KeepAlive>
              
              <div v-if="ui.activeRightTab !== 'taxonomy' && ui.activeRightTab !== 'interactions'" class="p-4 text-sm text-slate-500">
                Currently viewing: <strong class="text-slate-800">{{ ui.activeRightTab }}</strong> panel.
            </div>

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
import { useBloomStore } from '@/stores/bloom'
import { useAppStore } from '@/stores/app'
import Dropdown from '@/components/common/Dropdown.vue'
import * as api from '@/services/api' 

// Extracted Icons
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import ReportIcon from '@/components/icons/ReportIcon.vue'
import PanelIcon from '@/components/icons/PanelIcon.vue'

// Sidebar Content Components
import TaxonomyTree from '@/components/bloom/TaxonomyTree.vue'
import InteractionExplorer from '@/components/bloom/InteractionExplorer.vue' // <-- IMPORTED

const ui = useUiStore()
const bloomStore = useBloomStore()
const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const availableOfferings = ref([])
const latestReportRoute = ref('/') // Fallback route until data loads

const fullBloomsData = ref({}) 
const lastVisitedMap = ref({}) 

// 1. The 'memory bank wacher'
watch(
  () => [route.params.offeringXid, route.params.periodType, route.params.periodId, route.query, route.name],
  ([xid, pType, pId, currentQuery, routeName]) => {
    if (xid && pType && pId && routeName) {
      if (!lastVisitedMap.value[xid]) {
        lastVisitedMap.value[xid] = { dashboard: null, report: null }
      }
      // Route names containing 'Dashboard' go to the dashboard bucket, otherwise report
      const viewType = String(routeName).includes('Dashboard') ? 'dashboard' : 'report'
      lastVisitedMap.value[xid][viewType] = { pType, pId, query: { ...currentQuery } }
    }
  },
  { immediate: true, deep: true }
)

// 2. The 'layout snap' watcher for sidebar
const enableTransitions = ref(true)

watch(
  () => route.name,
  (newName, oldName) => {
    // Only snap if the actual page view changed
    if (newName !== oldName) {
      enableTransitions.value = false
      
      // Re-enable CSS transitions after Vue has painted the new DOM
      setTimeout(() => {
        enableTransitions.value = true
      }, 100)
    }
  }
)

const activeOffering = computed({
  get: () => route.params.offeringXid || '',
  set: (newXid) => {
    if (!newXid || newXid === route.params.offeringXid) return
    
    // 1. Initialize variables without hardcoded fallbacks
    let targetType = route.params.periodType
    let targetId = route.params.periodId
    let targetOfferingType = route.params.offeringType
    let targetQuery = {} 

    const isRoot = !route.name || route.name === 'home'
    const targetRouteName = isRoot ? 'BloomDashboard' : route.name
    
    // 2. Pull from the correct memory bucket based on the current view
    const viewType = String(targetRouteName).includes('Dashboard') ? 'dashboard' : 'report'
    const history = lastVisitedMap.value[newXid]?.[viewType]
    
    // 3. Apply memory or calculate real latest available
    if (history) {
      targetType = history.pType
      targetId = history.pId
      targetQuery = history.query || {} 
    } else {
      const offeringData = fullBloomsData.value[newXid]
      if (offeringData) {
        targetOfferingType = offeringData.details?.offeringType || targetOfferingType
        const blooms = offeringData.blooms || []
        if (blooms.length > 0) {
          const latest = [...blooms].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
          targetType = latest.bloomType
          targetId = latest.bloomKey
        }
      }
    }

    // 4. Construct strict route payload
    const newParams = { ...route.params }
    
    newParams.offeringXid = newXid
    if (targetOfferingType) newParams.offeringType = targetOfferingType
    if (targetType) newParams.periodType = targetType
    if (targetId) newParams.periodId = targetId

    if (!newParams.orgXid) {
      newParams.orgXid = appStore.orgXid 
    }

    // 5. Execute routing
    router.push({
      name: targetRouteName,
      params: newParams,
      query: targetQuery
    })
  }
})

const dashboardLink = computed(() => {
  const xid = route.params.offeringXid
  
  // 1. If there's no offering selected at all, the link should be dead
  if (!xid) return ''

  const history = lastVisitedMap.value[xid]?.dashboard

  // 2. Base our defaults on the URL first
  let oType = route.params.offeringType
  let pType = route.params.periodType
  let pId = route.params.periodId

  // 3. If we have no history, calculate the REAL latest data for this specific offering
  if (!history) {
    const offeringData = fullBloomsData.value[xid]
    if (offeringData) {
      oType = offeringData.details?.offeringType || oType
      const blooms = offeringData.blooms || []
      if (blooms.length > 0) {
        const latest = [...blooms].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
        pType = latest.bloomType || pType
        pId = latest.bloomKey || pId
      }
    }
  }

  // 4. Resolve the final parameters (URL -> History -> Latest Computed -> App Store)
  const finalOrg = route.params.orgXid || appStore.orgXid
  const finalOType = oType
  const finalPType = history ? history.pType : pType
  const finalPId = history ? history.pId : pId

  // 5. Strict Guard: If we are missing any piece of the puzzle, don't generate a broken route
  if (!finalOrg || !finalOType || !finalPType || !finalPId) return ''

  return {
    name: 'BloomDashboard',
    params: {
      orgXid: finalOrg,
      offeringType: finalOType,
      offeringXid: xid,
      periodType: finalPType,
      periodId: finalPId
    },
    query: history ? history.query : {}
  }
})

const reportLink = computed(() => {
  const xid = route.params.offeringXid
  if (!xid) return latestReportRoute.value // Fallback to the global latest we found onMount

  const history = lastVisitedMap.value[xid]?.report

  // If we have history for this specific app, use it!
  if (history) {
    const finalOrg = route.params.orgXid || appStore.orgXid
    const finalOType = route.params.offeringType
    
    if (!finalOrg || !finalOType || !history.pType || !history.pId) return ''

    return {
      name: 'BloomReport', 
      params: {
        orgXid: finalOrg,
        offeringType: finalOType,
        offeringXid: xid,
        periodType: history.pType,
        periodId: history.pId
      },
      query: history.query || {}
    }
  }
  
  // If no history, just go to the global latest
  return latestReportRoute.value 
})

onMounted(async () => {
  try {
    // 1. Tell the store to go fetch the data
    await appStore.fetchSession()
    await bloomStore.loadAvailableBlooms()
    
    // 2. Read the newly populated data directly from the store state!
    const bloomsObj = bloomStore.availableBloomsDirectory
    
    if (bloomsObj && Object.keys(bloomsObj).length > 0) {
      
      fullBloomsData.value = bloomsObj 

      availableOfferings.value = Object.keys(bloomsObj).map(xid => {
        const offering = bloomsObj[xid]
        const appName = offering?.details?.name
        return {
          id: xid, 
          label: appName ? `${appName} (${xid})` : xid 
        }
      })

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

      if (latestReport && latestDetails) {
        const org = route.params.orgXid || appStore.orgXid
        const type = latestDetails.offeringType || 'app'
        const xid = latestDetails.offeringXid
        const pType = latestReport.bloomType
        const pId = latestReport.bloomKey
        
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
