<template>
  <div class="bg-slate-50 min-h-screen pb-20">
    
    <div class="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div class="flex flex-col gap-1 mb-8">
        <span class="text-[11px] font-extrabold text-bloom-primary uppercase tracking-[0.2em]">Command Center</span>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Organization Overview
        </h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Collected</span>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-extrabold text-slate-900 leading-none">{{ formatNumber(globalStats.available) }}</span>
            <span class="text-xs font-medium text-slate-500 pb-0.5">Interactions</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col relative overflow-hidden">
          <div class="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-10"></div>
          <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI Analyzed
          </span>
          <div class="flex items-end gap-2 z-10">
            <span class="text-3xl font-extrabold text-indigo-900 leading-none">{{ formatNumber(globalStats.analyzed) }}</span>
            <span class="text-xs font-medium text-indigo-600/70 pb-0.5">Interactions</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monitored Offerings</span>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-extrabold text-slate-900 leading-none">{{ portfolio.length }}</span>
            <span class="text-xs font-medium text-slate-500 pb-0.5">Active</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Data Pipelines</span>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-extrabold text-slate-900 leading-none">{{ globalStats.sources }}</span>
            <span class="text-xs font-medium text-slate-500 pb-0.5">Syncing</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div class="xl:col-span-2 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-slate-900">Portfolio Offerings</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="offering in portfolio" 
              :key="offering.xid"
              class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full relative overflow-hidden"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex flex-col pr-4">
                  <h3 class="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate" :title="offering.name">
                    {{ offering.name }}
                  </h3>
                  <span class="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                    {{ offering.type }} &bull; LATEST: {{ offering.latestPeriod }}
                  </span>
                </div>
                
                <img v-if="offering.icon" :src="offering.icon" :alt="offering.name" class="w-10 h-10 rounded-xl border border-slate-100 shadow-sm shrink-0 object-cover" />
                <div v-else class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <span class="text-slate-400 text-xs font-bold">{{ offering.name.charAt(0) }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-5">
                <div class="flex flex-col border-l-2 border-emerald-400 pl-3">
                  <span class="text-xl font-extrabold text-slate-900">{{ offering.joyScore }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Joy Score</span>
                </div>
                <div class="flex flex-col border-l-2 border-slate-200 pl-3 justify-center">
                  <div class="flex items-end gap-1.5 leading-none mb-1">
                    <span class="text-sm font-bold text-indigo-600">{{ formatNumber(offering.analyzed) }}</span>
                    <span class="text-[10px] text-slate-400">/ {{ formatNumber(offering.available) }}</span>
                  </div>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Analyzed</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                <RouterLink 
                  :to="`/${appStore.orgXid}/dashboard/${offering.type}/${offering.xid}/${offering.latestType}/${offering.latestPeriod}`"
                  class="flex-1 py-1.5 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md transition-colors"
                >
                  Dashboard
                </RouterLink>
                <RouterLink 
                  :to="`/${appStore.orgXid}/reports/${offering.type}/${offering.xid}/${offering.latestType}/${offering.latestPeriod}`"
                  class="flex-1 py-1.5 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-md transition-colors"
                >
                  Report
                </RouterLink>
                
                <button 
                  v-if="offering.available > offering.analyzed"
                  class="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Analyze {{ formatNumber(offering.available - offering.analyzed) }} New Interactions
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-1 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-slate-900">7-Day Monitor (Cross-Portfolio)</h2>
          
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col">
            <div v-if="topIssue" class="flex flex-col">
              <span class="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold uppercase tracking-wider rounded border border-rose-100 w-fit mb-3">
                High Impact Issue
              </span>
              <h4 class="text-sm font-bold text-slate-900 leading-snug mb-2">
                {{ topIssue.title }}
              </h4>
              <p class="text-xs text-slate-500 line-clamp-3 mb-4">
                {{ topIssue.summary }}
              </p>
              
              <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-slate-900">{{ formatNumber(topIssue.reach) }}</span>
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Est. Reach</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <img v-if="topIssue.icon" :src="topIssue.icon" class="w-4 h-4 rounded-sm" />
                  <span class="text-[10px] text-slate-500 font-medium">{{ topIssue.offeringName }}</span>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center h-full text-center py-8">
              <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h4 class="text-sm font-bold text-slate-900 mb-1">All Streams Healthy</h4>
              <p class="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                No severe cross-portfolio issues detected in the past 7 days.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { useAppStore } from '@/stores/app'

const bloomStore = useBloomStore()
const appStore = useAppStore()

const formatNumber = (num) => (num || 0).toLocaleString('en-US')

// --- DATA HYDRATION ---
// This digests the existing bloom store to populate the UI. 
// In the future, this is replaced by the dedicated `/home/portfolio` API.
const portfolio = computed(() => {
  const directory = bloomStore.availableBloomsDirectory || {}
  console.log(directory);
  const items = []

  for (const [xid, data] of Object.entries(directory)) {
    const details = data.details || {}
    const blooms = data.blooms || []
    
    if (blooms.length === 0) continue

    const latest = [...blooms].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

    // Stubbing 'available' volume for the prototype (Available > Analyzed)
    const mockAnalyzed = latest.stats?.reviewsAnalyzed || 0
    const mockAvailable = mockAnalyzed > 0 ? Math.floor(mockAnalyzed * 1.3) : 0

    items.push({
      xid,
      name: details.name || xid,
      type: details.offeringType || 'app',
      icon: details.icon || null, // Picked up from the context/snippet payload
      latestPeriod: latest.bloomKey,
      latestType: latest.bloomType,
      joyScore: latest.stats?.joyScore?.toFixed(2) || 'N/A',
      analyzed: mockAnalyzed,
      available: mockAvailable
    })
  }
  
  return items.sort((a, b) => a.name.localeCompare(b.name))
})

const globalStats = computed(() => {
  let analyzed = 0
  let available = 0
  portfolio.value.forEach(p => {
    analyzed += p.analyzed
    available += p.available
  })
  
  return {
    analyzed,
    available,
    sources: Object.keys(bloomStore.sourcesWithVersion || {}).length || 2 // Fallback
  }
})

// Extract the highest impact issue from the currently loaded full blooms
const topIssue = computed(() => {
  if (!bloomStore.allIssues || bloomStore.allIssues.length === 0) return null
  
  // Sort by RICE reach
  const sorted = [...bloomStore.allIssues].sort((a, b) => {
    const reachA = a.rice?.reach?.value || 0
    const reachB = b.rice?.reach?.value || 0
    return reachB - reachA
  })
  
  const target = sorted[0]
  if (!target) return null
  
  return {
    title: target.title,
    summary: target.description?.summary || '',
    reach: target.rice?.reach?.value || 0,
    offeringName: bloomStore.offeringContext?.name || 'Unknown',
    icon: bloomStore.offeringContext?.icon || null
  }
})
</script>
