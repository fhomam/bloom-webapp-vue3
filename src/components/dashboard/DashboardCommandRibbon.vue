<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
    
    <div class="flex flex-col gap-2 xl:w-1/3">
      <div class="flex items-end gap-3">
        <span class="text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
          {{ joyScore }}
        </span>
        <div class="flex flex-col pb-1">
          <span class="text-2xl">{{ joyEmoji }}</span>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {{ joyLabel }}
          </span>
        </div>
      </div>
      
      <div class="mt-2 text-xs font-medium text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
        Encompasses <strong>{{ formattedInteractions }}</strong> interactions<br />
        across <strong>{{ stats.countries }}</strong> countries & <strong>{{ stats.sources }}</strong> sources
      </div>
    </div>

    <div class="flex flex-col items-center justify-center gap-3 xl:w-1/3 text-center">
      <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
        {{ offeringTitle }}
      </h2>
      
      <div class="flex items-center gap-2 text-sm">
        <span class="text-slate-500 font-medium">Period:</span>
        <button class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold transition-colors">
          {{ activePeriod }}
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>
    </div>

    <div class="flex flex-col xl:items-end gap-4 xl:w-1/3">
      
      <div class="flex items-center gap-6">
        <div class="flex flex-col xl:items-end">
          <span class="text-sm font-semibold text-slate-900">{{ companyMeta.name }}</span>
          <span class="text-xs text-slate-500">Est. users: {{ companyMeta.users }}</span>
        </div>
        
        <div class="h-10 w-px bg-slate-200"></div> <div class="flex flex-col items-end">
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold text-slate-900 tracking-tight">{{ pmiScore }}%</span>
            <button class="text-slate-400 hover:text-bloom-primary transition-colors" title="View PMI 2-Pager">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          </div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Market Impedance</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors shadow-sm">
          Source: All
          <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <button class="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors shadow-sm">
          Country: All
          <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Placeholder Props (These will eventually be fed by Pinia/URL state)
const joyScore = -0.79
const joyLabel = "Mostly Frustrated"
const joyEmoji = "😤"

const stats = {
  interactions: 21200,
  countries: 27,
  sources: 2
}

const offeringTitle = "Hilton Honors"
const activePeriod = "2026Q1"
const pmiScore = 3
const companyMeta = {
  name: "Hilton Worldwide",
  users: "21 Million"
}

// Utility to make big numbers look premium
const formattedInteractions = computed(() => {
  return new Intl.NumberFormat('en-US').format(stats.interactions)
})
</script>
