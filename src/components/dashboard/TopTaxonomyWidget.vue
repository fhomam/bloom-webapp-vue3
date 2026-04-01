<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Top Drivers
      </h3>
      <span class="text-xs font-medium text-slate-400">By Volume</span>
    </div>

    <div class="flex p-1 bg-slate-100 rounded-lg mb-4 self-start">
      <button 
        v-for="tab in ['categories', 'topics', 'issues']" 
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all', 
          activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        {{ tab }}
      </button>
    </div>

    <div class="flex flex-col gap-2 flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
      
      <div 
        v-for="(item, index) in currentList" 
        :key="item.id"
        class="relative flex items-center justify-between py-2.5 px-3 rounded-lg group hover:bg-slate-50 transition-colors cursor-default"
      >
        <div 
          class="absolute inset-y-1 left-1 bg-slate-100/50 rounded-md -z-10 transition-all duration-500"
          :style="{ width: `${(item.interactions / maxInteractions) * 98}%` }"
        ></div>

        <div class="flex items-center gap-3 overflow-hidden pr-4 z-10">
          <span class="text-[10px] font-bold text-slate-400 w-3 text-right shrink-0">
            {{ index + 1 }}
          </span>
          <div class="flex flex-col truncate">
            <span class="text-sm font-semibold text-slate-800 truncate" :title="item.title">
              {{ item.title }}
            </span>
            <span class="text-[10px] text-slate-400 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {{ item.taxo }}
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 z-10">
          <span class="text-sm font-bold text-slate-900 leading-none">
            {{ formattedNumber(item.interactions) }}
          </span>
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
            Int.
          </span>
        </div>
        
      </div>

    </div>

    <div class="mt-4 pt-4 border-t border-slate-100">
      <button class="text-xs font-bold text-bloom-primary hover:text-indigo-800 transition-colors flex items-center gap-1">
        Explore Taxonomy Tree
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('categories')

// Mock Data mimicking your JSON structure and stats pre-calculated by Pinia
const mockData = {
  categories: [
    { id: 'c1', title: 'Technical Challenges', taxo: 'technical', interactions: 12500 },
    { id: 'c2', title: 'General Feedback and Miscellaneous Insights', taxo: 'other', interactions: 4200 },
    { id: 'c3', title: 'Account & Profile', taxo: 'account', interactions: 3100 },
    { id: 'c4', title: 'Booking Experience', taxo: 'booking', interactions: 1400 }
  ],
  topics: [
    { id: 't1', title: 'Functionality and Stability Issues', taxo: 'technical:stability', interactions: 8200 },
    { id: 't2', title: 'Reservation Management', taxo: 'booking:management', interactions: 3100 },
    { id: 't3', title: 'Digital Key Access Issues', taxo: 'technical:digital_key', interactions: 2800 },
    { id: 't4', title: 'Login Challenges', taxo: 'account:login', interactions: 2100 },
    { id: 't5', title: 'Comprehensive User Feedback', taxo: 'other:all', interactions: 1500 }
  ],
  issues: [
    { id: 'i1', title: 'App Repeatedly Fails to Function', taxo: 'technical:stability:crash', interactions: 4100 },
    { id: 'i2', title: 'General Positive Feedback', taxo: 'other:all:non_issue', interactions: 2200 },
    { id: 'i3', title: 'Digital Key Fails to Unlock Door', taxo: 'technical:digital_key:fail', interactions: 1800 },
    { id: 'i4', title: 'Cannot Reset Password via Email', taxo: 'account:login:reset_fail', interactions: 950 },
    { id: 'i5', title: 'App Update Causes Navigation Lag', taxo: 'technical:stability:lag', interactions: 600 }
  ]
}

const currentList = computed(() => {
  // Returns the array sorted by highest interactions
  return [...mockData[activeTab.value]].sort((a, b) => b.interactions - a.interactions)
})

const maxInteractions = computed(() => {
  // Used to calculate the percentage width of the inline background bar
  if (currentList.value.length === 0) return 1
  return currentList.value[0].interactions
})

const formattedNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>