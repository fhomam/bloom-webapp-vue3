<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-4 min-[480px]:p-5 lg:p-6 shadow-sm grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-[auto_1fr_auto] gap-y-4 min-[480px]:gap-y-5 gap-x-4 lg:gap-x-8 items-center relative z-10 w-full">
    
    <DashboardRibbonJoyScore />

    <div class="col-span-1 min-[480px]:col-span-2 md:col-span-1 row-start-1 md:row-start-1 flex flex-col items-center justify-center text-center min-w-0 w-full px-1 min-[480px]:px-2">
      <span class="text-[9px] lg:text-[10px] font-extrabold text-bloom-primary uppercase tracking-[0.2em] mb-1.5">
        Executive Dashboard
      </span>
      
      <h2 class="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight text-center leading-tight mb-3 lg:mb-4 w-full">
        {{ offeringTitle }}
      </h2>
      
      <div class="flex flex-wrap items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-lg py-1 lg:py-1.5 px-2 lg:px-3 w-fit">
        <Dropdown v-model="activePeriodType" :options="periodTypeOptions" variant="minimal" />
        <span class="text-slate-300 font-light text-xs">/</span>
        <Dropdown v-model="activePeriodId" :options="periodIdOptions" variant="minimal" class="uppercase" />
      </div>
    </div>

    <DashboardRibbonPmi />

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'
import Dropdown from '@/components/common/Dropdown.vue'
import DashboardRibbonJoyScore from './DashboardRibbonJoyScore.vue'
import DashboardRibbonPmi from './DashboardRibbonPmi.vue'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

const offeringTitle = computed(() => bloomStore.offeringContext?.name || 'Loading...')

const updateRouteParam = (paramName, newValue) => {
  const newParams = { ...route.params, [paramName]: newValue }
  router.push({ params: newParams, query: route.query })
}

// --- DYNAMIC DROPDOWN OPTIONS ---
const currentOfferingBlooms = computed(() => {
  const directory = bloomStore.availableBloomsDirectory || {}
  const appData = directory[route.params.offeringXid]
  return appData?.blooms || []
})

const periodTypeOptions = computed(() => {
  const availableTypes = new Set(currentOfferingBlooms.value.map(b => b.bloomType))
  const map = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
  const order = ['yearly', 'quarterly', 'monthly', 'weekly']
  
  return Array.from(availableTypes)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map(t => ({ id: t, label: map[t] || t }))
})

const periodIdOptions = computed(() => {
  const filtered = currentOfferingBlooms.value.filter(b => b.bloomType === route.params.periodType)
  return filtered.map(b => {
    return { id: b.bloomKey, label: b.bloomKey.toUpperCase() }
  }).sort((a, b) => b.id.localeCompare(a.id)) 
})

const activePeriodType = computed({
  get: () => route.params.periodType || periodTypeOptions.value[0]?.id || 'quarterly',
  set: (newType) => {
    const bloomsForNewType = currentOfferingBlooms.value
      .filter(b => b.bloomType === newType)
      .sort((a, b) => b.bloomKey.localeCompare(a.bloomKey)) 
    
    const latestValidId = bloomsForNewType[0]?.bloomKey || 'latest'

    router.push({
      params: { ...route.params, periodType: newType, periodId: latestValidId },
      query: route.query
    })
  }
})

const activePeriodId = computed({
  get: () => route.params.periodId || periodIdOptions.value[0]?.id || '',
  set: (val) => updateRouteParam('periodId', val)
})
</script>
