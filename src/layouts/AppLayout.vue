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
             <div class="text-sm text-slate-500">Currently viewing: <strong class="text-slate-800">{{ ui.activeRightTab }}</strong> panel.</div>
          </div>
        </aside>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import Dropdown from '@/components/common/Dropdown.vue'
import * as api from '@/services/api' 

// Extracted Icons
import DashboardIcon from '@/components/icons/DashboardIcon.vue'
import ReportIcon from '@/components/icons/ReportIcon.vue'
import PanelIcon from '@/components/icons/PanelIcon.vue'

const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const availableOfferings = ref([])
const latestReportRoute = ref('/') // Fallback route until data loads

// Two-way binding: Reads offeringXid from URL, updates URL on change
const activeOffering = computed({
  get: () => route.params.offeringXid || '',
  set: (newXid) => {
    if (!newXid || newXid === route.params.offeringXid) return
    
    // Explicitly build the parameter payload so missing properties don't crash the router
    const newRoute = {
      name: 'BloomReport', // Make sure this matches your router/index.js!
      params: { 
        orgXid: route.params.orgXid || 'org_1',
        offeringType: route.params.offeringType || 'app',
        offeringXid: newXid, 
        periodType: route.params.periodType || 'quarterly',
        periodId: route.params.periodId || '2026q1'
      },
      query: route.query
    }

    // FIX: Console log to verify exactly what is being pushed
    console.log('🔄 Dropdown triggering route change:', newRoute)
    router.push(newRoute)
  }
})

onMounted(async () => {
  try {
    const bloomsData = await api.getAvailableBlooms()
    
    if (bloomsData && typeof bloomsData === 'object') {
      // 1. Populate Dropdown Options
      availableOfferings.value = Object.keys(bloomsData).map(xid => ({
        id: xid,
        label: xid
      }))

      // 2. Find the absolute latest report globally to power the Left Nav link
      let latest = null
      for (const [xid, reports] of Object.entries(bloomsData)) {
        for (const report of reports) {
          if (!latest || new Date(report.updatedAt) > new Date(latest.updatedAt)) {
            latest = report
          }
        }
      }

      // If we found a valid latest report, construct its route dynamically
      if (latest) {
        // Fallback to org_1 for now if your API doesn't return the orgXid in the snippet
        latestReportRoute.value = `/org_1/report/${latest.offeringType}/${latest.offeringXid}/${latest.bloomType}/${latest.bloomKey}`
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
