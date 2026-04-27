<template>
  <div class="col-span-1 min-[480px]:col-span-1 row-start-3 min-[480px]:row-start-2 md:row-start-1 flex flex-col xl:flex-row justify-center min-[480px]:justify-end items-center min-[480px]:items-end xl:items-center gap-1 xl:gap-5 border-t border-slate-100 min-[480px]:border-0 pt-4 min-[480px]:pt-0 mt-1 min-[480px]:mt-0 w-full">
      
    <div class="hidden md:flex flex-col items-end text-right order-2 xl:order-1 mt-1 xl:mt-0">
      <span class="text-[11px] xl:text-[15px] font-bold text-slate-600 xl:text-slate-900 leading-none">{{ companyMeta.name }}</span>
      <span class="text-[9px] xl:text-[10px] font-bold text-slate-400 xl:text-slate-500 uppercase tracking-wider mt-0.5">Est. Users: {{ companyMeta.users }}</span>
    </div>
    
    <div class="h-10 w-px bg-slate-200 hidden xl:block order-2"></div> 

    <div ref="pmiContainerRef" class="flex flex-col items-center min-[480px]:items-end justify-center pt-1 order-1 xl:order-3 relative w-full min-[480px]:w-auto">
      
      <div class="flex items-center justify-center min-[480px]:justify-end gap-1 mb-0.5 w-full">
        <span class="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quarterly</span>
        <button @click.stop="toggleMainDetails" class="text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </div>

      <div class="flex items-center justify-center min-[480px]:justify-end gap-1.5 lg:gap-2 w-full">
        
        <div class="flex items-end gap-[2px] lg:gap-[3px] h-3.5 lg:h-5 mr-1">
          <div v-for="(q, idx) in pmiMetrics.bars" :key="idx" class="relative h-full flex items-end">
            
            <div 
              @click.stop="(e) => toggleBarPopup(idx, e)"
              :class="['w-1 lg:w-1.5 rounded-sm transition-all cursor-pointer', q.styleClass, uiState.activeBarIdx === idx ? 'ring-2 ring-bloom-primary ring-offset-1 z-10' : '']"
              :style="{ height: q.height }">
            </div>

            <div v-if="uiState.activeBarIdx === idx" 
                 class="absolute bottom-full mb-3 z-50 w-44 bg-white border border-slate-200 shadow-xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-150"
                 :style="uiState.popupBoxStyle">
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{{ q.period }}</span>
                <template v-if="q.status === 'valid'">
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="text-xl font-extrabold text-slate-900 leading-none">{{ q.pmi }}%</span>
                    <span class="text-[10px] font-bold text-slate-500">PMI</span>
                  </div>
                  <span class="text-[10px] text-slate-500 mt-1 leading-tight">
                    Based on <strong>{{ formatNumber(q.interactionVolume) }}</strong> interactions
                  </span>
                </template>
                <template v-else-if="q.status === 'insufficient_data'">
                  <span class="text-sm font-bold text-amber-600 mt-0.5 leading-tight">Pending Data</span>
                  <span class="text-[10px] text-slate-500 mt-1 leading-tight">{{ q.count }} / 100 required interactions</span>
                </template>
                <template v-else>
                  <span class="text-sm font-bold text-slate-600 mt-0.5 leading-tight">Data Unavailable</span>
                  <span class="text-[10px] text-slate-500 mt-1 leading-tight">Requires AI analysis run</span>
                </template>
              </div>
              <div class="absolute -bottom-1.5 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"
                   :style="uiState.popupPointerStyle"></div>
            </div>
          </div>
        </div>

        <span :class="['text-2xl lg:text-[28px] font-extrabold tracking-tight leading-none', pmiMetrics.scoreClass]">
          {{ pmiMetrics.scoreDisplay }}
        </span>
        
        <span v-if="pmiMetrics.delta !== null" :class="['text-[11px] lg:text-sm font-bold', pmiMetrics.delta > 0 ? 'text-rose-500' : 'text-emerald-500']">
          {{ pmiMetrics.delta > 0 ? '+' : '' }}{{ pmiMetrics.delta }}%
        </span>
      </div>
      
      <span class="text-[8px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 text-center min-[480px]:text-right w-full">
        Product Market Impedance
      </span>

      <div v-if="uiState.showMainDetails" class="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 text-left animate-in fade-in zoom-in-95 duration-200">
        <p v-if="pmiMetrics.current?.status === 'valid'" class="text-xs text-slate-600 leading-relaxed mb-3">
          PMI measures friction versus value flow. Evaluated strictly on a quarterly basis to provide a stable measure of product health, regardless of selected date filters.
        </p>
        <p v-else-if="pmiMetrics.current?.status === 'insufficient_data'" class="text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-100 leading-relaxed mb-3">
          <strong>Pending Data:</strong> PMI requires a minimum of 100 analyzed interactions for statistical significance.
        </p>
        <p v-else class="text-xs text-slate-500 bg-slate-50 rounded p-2 border border-slate-100 leading-relaxed mb-3">
          <strong>Data Unavailable:</strong> This quarter requires AI analysis to calculate impedance.
        </p>
        <a href="https://www.withbloom.ai/two-pagers/product-market-impedance" target="_blank" class="text-[11px] font-bold text-bloom-primary hover:text-slate-900 transition-colors inline-flex items-center gap-1">
          Read the PMI Two-Pager
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
// [Script remains exactly unchanged]
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBloomStore } from '@/stores/bloom'

const bloomStore = useBloomStore()
const pmiContainerRef = ref(null)

const uiState = reactive({
  showMainDetails: false,
  activeBarIdx: null,
  popupBoxStyle: {},
  popupPointerStyle: {}
})

const toggleMainDetails = () => {
  uiState.activeBarIdx = null
  uiState.showMainDetails = !uiState.showMainDetails
}

const toggleBarPopup = (idx, event) => {
  uiState.showMainDetails = false
  if (uiState.activeBarIdx === idx) {
    uiState.activeBarIdx = null
    return
  }
  
  uiState.activeBarIdx = idx

  if (event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    
    if (spaceRight < 90) {
      uiState.popupBoxStyle = { right: '-12px', left: 'auto' }
      uiState.popupPointerStyle = { right: '14px', left: 'auto' }
    } else if (spaceLeft < 90) {
      uiState.popupBoxStyle = { left: '-12px', right: 'auto' }
      uiState.popupPointerStyle = { left: '14px', right: 'auto' }
    } else {
      uiState.popupBoxStyle = { left: '50%', transform: 'translateX(-50%)' }
      uiState.popupPointerStyle = { left: '50%', transform: 'translateX(-50%)' }
    }
  }
}

const closePopovers = (e) => {
  if (pmiContainerRef.value && !pmiContainerRef.value.contains(e.target)) {
    uiState.showMainDetails = false
    uiState.activeBarIdx = null
  }
}

onMounted(() => document.addEventListener('click', closePopovers))
onBeforeUnmount(() => document.removeEventListener('click', closePopovers))

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0)
const formatCompact = (num) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(num || 0)

const companyMeta = computed(() => ({
  name: bloomStore.offeringContext?.developer?.name || 'Unknown Developer',
  users: bloomStore.offeringContext?.installs ? formatCompact(bloomStore.offeringContext.installs) : 'Unknown'
}))

const pmiMetrics = computed(() => {
  const data = bloomStore.pmiHistory
  
  if (!data || data.length < 4) return { current: null, scoreDisplay: '--%', delta: null, bars: [] }

  const current = data[3]
  const previous = data[2]

  let scoreDisplay = '--%'
  let scoreClass = 'text-slate-900'
  
  if (current.status === 'valid') {
    scoreDisplay = `${current.pmi}%`
  } else if (current.status === 'insufficient_data') {
    scoreDisplay = 'N/A'
    scoreClass = 'text-slate-400'
  } else {
    scoreDisplay = '--%'
    scoreClass = 'text-slate-400'
  }

  let delta = null
  if (current.status === 'valid' && previous && previous.status === 'valid') {
    delta = +(current.pmi - previous.pmi).toFixed(1)
  }

  const validPmis = data.filter(d => d.status === 'valid').map(d => d.pmi)
  const maxPmi = validPmis.length ? Math.max(...validPmis) : 10
  const baseline = maxPmi * 1.2 || 10 

  const bars = data.map((d, index) => {
    const isLatest = index === 3
    if (d.status === 'valid') {
      return { 
        ...d, 
        height: `${(d.pmi / baseline) * 100}%`, 
        styleClass: isLatest ? 'bg-slate-800' : 'bg-slate-200 hover:bg-slate-300'
      }
    }
    return { 
      ...d, 
      height: `30%`, 
      styleClass: 'bg-transparent border border-dashed border-slate-300 hover:border-slate-400'
    }
  })

  return { current, scoreDisplay, scoreClass, delta, bars }
})
</script>