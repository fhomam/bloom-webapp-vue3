<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    
    <div class="bg-white rounded-2xl border border-slate-200 p-5 xl:p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
      <div class="flex items-start justify-between w-full mb-3">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Collected</span>
        <div class="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707-.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        </div>
      </div>
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
        <span class="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
          {{ formatCompactNumber(Number(homeStore.pulseData.totalAvailableInteractions)) }}
        </span>
        <span class="text-[11px] xl:text-xs font-semibold text-slate-500">Interactions</span>
      </div>
    </div>

    <div class="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-5 xl:p-6 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[120px]">
      <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full -z-10"></div>
      <div class="flex items-start justify-between w-full mb-3 z-10">
        <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1 flex items-center gap-1.5">
          AI Processed
        </span>
        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
      </div>
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 z-10" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
        <span class="text-3xl xl:text-4xl font-extrabold text-indigo-900 tracking-tight leading-none">
          {{ formatCompactNumber(Number(homeStore.pulseData.totalAnalyzedInteractions)) }}
        </span>
        <span class="text-[11px] xl:text-xs font-semibold text-indigo-600/80">Interactions</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-5 xl:p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
      <div class="flex items-start justify-between w-full mb-3">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Monitored</span>
        <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
        </div>
      </div>
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
        <span class="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
          {{ formatCompactNumber(Number(homeStore.pulseData.activeOfferingsCount)) }}
        </span>
        <span class="text-[11px] xl:text-xs font-semibold text-slate-500">Offerings</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-5 xl:p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
      <div class="flex items-start justify-between w-full mb-3">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Sources</span>
        <div class="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
        </div>
      </div>
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
        <span class="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
          {{ formatCompactNumber(Number(homeStore.pulseData.syncingSourcesCount)) }}
        </span>
      
        <span class="relative flex h-2 w-2 self-center shrink-0 translate-y-[6px] ml-[-3px]">
          <span :class="[syncStatus.pingColor, 'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75']"></span>
          <span :class="[syncStatus.dotColor, 'relative inline-flex rounded-full h-2 w-2']"></span>
        </span>
        <span class="text-[11px] xl:text-xs font-semibold text-slate-500 -ml-0.5">{{ syncStatus.label }}</span>

      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHomeStore } from '@/stores/home'
import { formatCompactNumber } from '@/library/utils'

const homeStore = useHomeStore()

// Future-proofed status logic for green/orange/red
const syncStatus = computed(() => {
  const total = Number(homeStore.pulseData.syncingSourcesCount) || 0
  // Assuming a future field for failed pipelines
  const failed = Number(homeStore.pulseData.failedSourcesCount) || 0 

  if (total === 0 && failed > 0) {
    // All Failing
    return { label: 'Failed', pingColor: 'bg-rose-400', dotColor: 'bg-rose-500' }
  } else if (failed > 0) {
    // Partially Failing
    return { label: 'Degraded', pingColor: 'bg-amber-400', dotColor: 'bg-amber-500' }
  } else {
    // All Healthy
    return { label: 'Syncing', pingColor: 'bg-emerald-400', dotColor: 'bg-emerald-500' }
  }
})
</script>