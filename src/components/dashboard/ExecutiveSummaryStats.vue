<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Categorization & Actionability
      </h3>
      <span class="text-xs font-medium text-slate-400">Current Period</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      
      <div class="flex flex-col gap-4">
        
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900">Backlog Candidates</h4>
            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">Actionable</span>
          </div>
          
          <div class="flex items-end gap-4 mt-1">
            <div class="flex flex-col">
              <span class="text-3xl font-extrabold text-slate-900 leading-none">{{ stats.backlog.issues }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Issues</span>
            </div>
            <div class="text-2xl text-slate-200 font-light mb-1">/</div>
            <div class="flex flex-col">
              <span class="text-xl font-bold text-slate-700 leading-none">{{ formattedNumber(stats.backlog.interactions) }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Interactions</span>
            </div>
          </div>
        </div>

        <div class="p-4 border border-slate-100 rounded-xl flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900">General Feedback</h4>
            <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded">Contextual</span>
          </div>
          
          <div class="flex items-end gap-4 mt-1">
            <div class="flex flex-col">
              <span class="text-2xl font-bold text-slate-700 leading-none">{{ stats.general.issues }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Clusters</span>
            </div>
            <div class="text-xl text-slate-200 font-light mb-1">/</div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-slate-600 leading-none">{{ formattedNumber(stats.general.interactions) }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Interactions</span>
            </div>
          </div>
        </div>

      </div>

      <div class="flex flex-col justify-between gap-6">
        
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-slate-500 mb-3">Actionable RICE Aggregate</span>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col border-l-2 border-indigo-500 pl-3">
              <span class="text-lg font-bold text-slate-900 leading-none">{{ formattedNumber(stats.rice.totalReach) }}+</span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Estimated Reach</span>
            </div>
            <div class="flex flex-col border-l-2 border-indigo-500 pl-3">
              <span class="text-lg font-bold text-slate-900 leading-none text-indigo-600">{{ stats.rice.avgImpact }}x</span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Avg Impact</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-semibold text-slate-500 mb-3">Dominant Themes</span>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="theme in stats.topThemes" 
              :key="theme.id"
              class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md"
            >
              <span class="text-xs font-semibold text-slate-700">{{ theme.name }}</span>
              <span class="text-[10px] text-slate-400 bg-white px-1 rounded">{{ theme.count }}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
// Mocking the aggregated data based exactly on your JSON payload structure
const stats = {
  backlog: {
    issues: 124,
    interactions: 18500
  },
  general: {
    issues: 32, // e.g., taxonomy: 'other:all:non_issue'
    interactions: 2700
  },
  rice: {
    totalReach: 1450000, // Sum of issue.rice.reach.value
    avgImpact: 0.85      // Avg of issue.rice.impact.value
  },
  topThemes: [
    { id: 'bug', name: 'Bug', count: 42 },
    { id: 'perf', name: 'Performance', count: 28 },
    { id: 'ux', name: 'UX', count: 19 },
    { id: 'compat', name: 'Compatibility', count: 12 }
  ]
}

const formattedNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}
</script>