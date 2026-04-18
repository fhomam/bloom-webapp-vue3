<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden min-w-[320px]">
    
    <aside 
      :class="[
        ui.isLeftCollapsed ? '-translate-x-full md:translate-x-0 md:w-16' : 'translate-x-0 w-64',
        'absolute md:relative inset-y-0 left-0 flex flex-col bg-slate-950 text-slate-400 border-r border-slate-800 transition-all duration-300 ease-in-out z-50 shrink-0'
      ]"
    >
      <div class="h-14 flex items-center justify-between md:justify-center px-4 md:px-0 border-b border-slate-800 shrink-0">
        <img 
          src="@/assets/bloom-icon-white-256px.png" 
          alt="Bloom" 
          class="w-8 h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
          @click="ui.isLeftCollapsed = !ui.isLeftCollapsed" 
        />
        <button @click="ui.isLeftCollapsed = true" class="md:hidden text-slate-400 hover:text-white">✕</button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 hide-scrollbar">
        
        <RouterLink 
          :to="`/${appStore.orgXid}/home`" 
          :class="[
            'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
            (route.name === 'home' || route.name === 'Home') ? 'bg-slate-800 text-white' : ''
          ]"
        >
          <HomeIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Portfolio</span>
        </RouterLink>

        <div :class="['my-2 border-t border-slate-800', ui.isLeftCollapsed ? 'mx-2' : 'mx-0']"></div>

        <RouterLink 
          :to="dashboardLink" 
          :class="[
            'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
            route.name === 'BloomDashboard' ? 'bg-slate-800 text-white' : ''
          ]"
        >
          <DashboardIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Dashboard</span>
        </RouterLink>
        
        <RouterLink 
          :to="reportLink" 
          :class="[
            'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
            route.name === 'BloomReport' ? 'bg-slate-800 text-white' : ''
          ]"
        >
          <ReportIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Bloom Report</span>
        </RouterLink>

        <div :class="['my-2 border-t border-slate-800', ui.isLeftCollapsed ? 'mx-2' : 'mx-0']"></div>

        <RouterLink 
          :to="`/${appStore.orgXid}/pipelines`" 
          :class="[
            'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
            route.name === 'Pipelines' ? 'bg-slate-800 text-white' : ''
          ]"
        >
          <PipelineIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Pipelines</span>
        </RouterLink>

        <RouterLink 
          :to="`/${appStore.orgXid}/connectors`" 
          :class="[
            'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
            route.name === 'Connectors' ? 'bg-slate-800 text-white' : ''
          ]"
        >
          <ConnectorIcon class="w-5 h-5 shrink-0" />
          <span :class="['ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">Connectors</span>
        </RouterLink>

      </nav>

      <div class="relative p-3 border-t border-slate-800 shrink-0">
        
        <div v-if="isUserMenuOpen" class="absolute bottom-full left-3 mb-2 w-56 bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700 z-50">
          <div class="px-4 py-3 border-b border-slate-700">
            <p class="text-sm text-white font-bold truncate">Organization Admin</p>
            <p class="text-xs text-slate-400 truncate">admin@example.com</p>
          </div>
          
          <div class="p-1">
            <RouterLink @click="isUserMenuOpen = false" :to="`/${appStore.orgXid}/billing`" class="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <BillingIcon class="w-4 h-4 mr-2" /> Billing
            </RouterLink>
            <RouterLink @click="isUserMenuOpen = false" :to="`/${appStore.orgXid}/settings`" class="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <SettingsIcon class="w-4 h-4 mr-2" /> Settings
            </RouterLink>
          </div>
          
          <div class="p-1 border-t border-slate-700">
            <button @click="handleLogout" class="w-full flex items-center px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-slate-700 rounded-lg transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Log out
            </button>
          </div>
        </div>

        <button 
          @click="isUserMenuOpen = !isUserMenuOpen" 
          class="w-full flex items-center p-2 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-bloom-primary focus:ring-opacity-50"
        >
          <div class="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
            AD
          </div>
          <div :class="['ml-3 text-left transition-opacity duration-300 overflow-hidden', ui.isLeftCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100']">
            <p class="text-sm font-medium text-white truncate">Admin</p>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider">Access Settings</p>
          </div>
        </button>

      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
      
      <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-40 w-full relative">
        
        <div class="flex items-center gap-3">
          <button @click="ui.isLeftCollapsed = false" class="md:hidden text-slate-500 hover:text-slate-900 mr-2">☰</button>
          
          <template v-if="!isGlobalView">
            <Dropdown 
              v-if="availableOfferings.length > 0" 
              v-model="activeOffering" 
              :options="availableOfferings" 
              variant="minimal" 
              class="font-semibold text-slate-800 -ml-2"
            />
            <span v-else-if="route.params.offeringXid" class="text-sm font-semibold text-slate-500 animate-pulse">Loading...</span>
          </template>
        </div>
        
        <div class="flex items-center gap-4">
          <button 
            v-if="ui.rightTabs.length > 0 && !isGlobalView && route.name === 'BloomReport'" 
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
            enableTransitions ? 'transition-all duration-300 ease-in-out' : '',
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

// Extracted Icons
import HomeIcon from '@/components/icons/HomeIcon.vue'
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import ReportIcon from '@/components/icons/ReportIcon.vue'
import PipelineIcon from '@/components/icons/PipelineIcon.vue'
import ConnectorIcon from '@/components/icons/ConnectorIcon.vue'
import BillingIcon from '@/components/icons/BillingIcon.vue'
import SettingsIcon from '@/components/icons/SettingsIcon.vue'
import PanelIcon from '@/components/icons/PanelIcon.vue'

// Sidebar Content Components
import TaxonomyTree from '@/components/bloom/TaxonomyTree.vue'
import InteractionExplorer from '@/components/bloom/InteractionExplorer.vue'

const ui = useUiStore()
const bloomStore = useBloomStore()
const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const availableOfferings = ref([])
const latestReportRoute = ref('/') 
const fullBloomsData = ref({}) 
const lastVisitedMap = ref({}) 
const isUserMenuOpen = ref(false)

// Global View Guard: Views that shouldn't show offering-specific UI
const isGlobalView = computed(() => {
  return ['home', 'Home', 'Pipelines', 'Connectors', 'Billing', 'Settings'].includes(route.name)
})

// Strict Guard: Only show Right Sidebar on BloomReport
const isSidebarEffectivelyOpen = computed(() => {
  return ui.isRightOpen && route.name === 'BloomReport'
})

// Handle Logout
const handleLogout = async () => {
  isUserMenuOpen.value = false
  try {
    // Await your auth logout logic here
    router.push('/login')
  } catch (err) {
    console.error("Logout failed", err)
  }
}

// 1. UI Store Memory Update Watcher
// Records the user's path into the UI Store when viewing an offering
watch(
  () => route.fullPath,
  () => {
    if (route.name === 'BloomDashboard') ui.lastDashboardRoute = route.fullPath
    if (route.name === 'BloomReport') ui.lastReportRoute = route.fullPath
  },
  { immediate: true }
)

// 2. Memory bank watcher (Filter / Query State)
watch(
  () => [route.params.offeringXid, route.params.periodType, route.params.periodId, route.query, route.name],
  ([xid, pType, pId, currentQuery, routeName]) => {
    if (xid && pType && pId && routeName && !isGlobalView.value) { 
      if (!lastVisitedMap.value[xid]) {
        lastVisitedMap.value[xid] = { dashboard: null, report: null }
      }
      const viewType = String(routeName).includes('Dashboard') ? 'dashboard' : 'report'
      lastVisitedMap.value[xid][viewType] = { pType, pId, query: { ...currentQuery } }
    }
  },
  { immediate: true, deep: true }
)

// Layout snap watcher
const enableTransitions = ref(true)
watch(
  () => route.name,
  (newName, oldName) => {
    if (newName !== oldName) {
      enableTransitions.value = false
      setTimeout(() => {
        enableTransitions.value = true
      }, 100)
    }
  }
)

// Active Offering Dropdown Model
const activeOffering = computed({
  get: () => route.params.offeringXid || '',
  set: (newXid) => {
    if (!newXid || newXid === route.params.offeringXid) return
    
    let targetType = route.params.periodType
    let targetId = route.params.periodId
    let targetOfferingType = route.params.offeringType
    let targetQuery = {} 

    const isRoot = !route.name || isGlobalView.value
    const targetRouteName = isRoot ? 'BloomDashboard' : route.name
    
    const viewType = String(targetRouteName).includes('Dashboard') ? 'dashboard' : 'report'
    const history = lastVisitedMap.value[newXid]?.[viewType]
    
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

    const newParams = { ...route.params }
    
    newParams.offeringXid = newXid
    if (targetOfferingType) newParams.offeringType = targetOfferingType
    if (targetType) newParams.periodType = targetType
    if (targetId) newParams.periodId = targetId
    if (!newParams.orgXid) newParams.orgXid = appStore.orgXid 

    router.push({
      name: targetRouteName,
      params: newParams,
      query: targetQuery
    })
  }
})

// Dynamic Dashboard Link (Uses UI Store Memory when on Home Page)
const dashboardLink = computed(() => {
  const xid = route.params.offeringXid
  
  if (!xid) return ui.lastDashboardRoute || `/${appStore.orgXid}/home`

  const history = lastVisitedMap.value[xid]?.dashboard

  let oType = route.params.offeringType
  let pType = route.params.periodType
  let pId = route.params.periodId

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

  const finalOrg = route.params.orgXid || appStore.orgXid
  const finalOType = oType
  const finalPType = history ? history.pType : pType
  const finalPId = history ? history.pId : pId

  if (!finalOrg || !finalOType || !finalPType || !finalPId) return `/${appStore.orgXid}/home`

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

// Dynamic Report Link (Uses UI Store Memory when on Home Page)
const reportLink = computed(() => {
  const xid = route.params.offeringXid
  
  if (!xid) return ui.lastReportRoute || `/${appStore.orgXid}/home`

  const history = lastVisitedMap.value[xid]?.report

  if (history) {
    const finalOrg = route.params.orgXid || appStore.orgXid
    const finalOType = route.params.offeringType
    
    if (!finalOrg || !finalOType || !history.pType || !history.pId) return `/${appStore.orgXid}/home`

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
  
  return ui.lastReportRoute || `/${appStore.orgXid}/home`
})

onMounted(async () => {
  try {
    await appStore.fetchSession()
    await bloomStore.loadAvailableBlooms()
    
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
        
        const defaultReport = `/${org}/reports/${type}/${xid}/${pType}/${pId}`
        const defaultDashboard = `/${org}/dashboard/${type}/${xid}/${pType}/${pId}`
        
        latestReportRoute.value = defaultReport 

        // Seed the UI store with initial valid routes so buttons work immediately on first boot!
        if (!ui.lastReportRoute) ui.lastReportRoute = defaultReport
        if (!ui.lastDashboardRoute) ui.lastDashboardRoute = defaultDashboard
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