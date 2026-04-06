<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Categorization & Actionability
        </h3>
        <div 
          class="cursor-help text-slate-300 hover:text-slate-500 transition-colors" 
          title="User interactions are grouped into auto-generated 'Packets' and classified by their actionability."
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
      </div>
      <span class="text-xs font-medium text-slate-400">Current Period</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      
      <div class="flex flex-col gap-4">
        
        <RouterLink :to="getClassUrl('backlog-candidate')" class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col transition-all hover:border-indigo-200 hover:bg-indigo-50/30 group cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">Backlog Candidates</h4>
            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded group-hover:bg-indigo-200 transition-colors">Actionable</span>
          </div>
          
          <div class="flex items-end gap-4 mt-1 flex-wrap sm:flex-nowrap">
            <div class="flex flex-col">
              <span class="text-3xl font-extrabold text-slate-900 leading-none group-hover:text-indigo-900 transition-colors">{{ stats.backlog.issues }}</span>
              <div class="flex items-center gap-1.5 mt-1.5">
                <div class="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ stats.backlog.issues === 1 ? 'Packet' : 'Packets' }}
                </div>
                <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+8%</span>
              </div>
            </div>
            <div class="text-2xl text-slate-200 font-light mb-1 hidden sm:block">/</div>
            <div class="flex flex-col">
              <span class="text-xl font-bold text-slate-700 leading-none">{{ formattedNumber(stats.backlog.interactions) }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                <span class="hidden sm:inline">Interactions</span>
                <span class="sm:hidden">Int.</span>
              </span>
            </div>
          </div>
        </RouterLink>

        <RouterLink :to="getClassUrl('non-actionable')" class="p-4 border border-slate-100 rounded-xl flex flex-col transition-all hover:border-slate-300 hover:bg-slate-50 cursor-pointer group">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">General Feedback</h4>
            <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded">Contextual</span>
          </div>
          
          <div class="flex items-end gap-4 mt-1 flex-wrap sm:flex-nowrap">
            <div class="flex flex-col">
              <span class="text-2xl font-bold text-slate-700 leading-none">{{ stats.general.issues }}</span>
              <div class="flex items-center gap-1.5 mt-1.5">
                <div class="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ stats.general.issues === 1 ? 'Packet' : 'Packets' }}
                </div>
                <span class="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">-2%</span>
              </div>
            </div>
            <div class="text-xl text-slate-200 font-light mb-1 hidden sm:block">/</div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-slate-600 leading-none">{{ formattedNumber(stats.general.interactions) }}</span>
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                <span class="hidden sm:inline">Interactions</span>
                <span class="sm:hidden">Int.</span>
              </span>
            </div>
          </div>
        </RouterLink>

      </div>

      <div class="flex flex-col justify-between gap-6">
        
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-slate-500 mb-3">Actionable RICE Aggregate</span>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col border-l-2 border-indigo-500 pl-3">
              <span class="text-lg font-bold text-slate-900 leading-none">{{ formattedNumber(stats.rice.avgReach) }}</span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Avg Est. Reach</span>
            </div>
            <div class="flex flex-col border-l-2 border-indigo-500 pl-3">
              <span class="text-lg font-bold text-indigo-600 leading-none">{{ stats.rice.avgImpact }}x</span>
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Avg Impact</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col">
          <span class="text-xs font-semibold text-slate-500 mb-3">Dominant Themes</span>
          <div v-if="stats.topThemes.length > 0" class="flex flex-wrap gap-2">
            <RouterLink 
              v-for="theme in stats.topThemes" 
              :key="theme.id"
              :to="getThemeUrl(theme.id)"
              class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer group"
            >
              <span class="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">{{ theme.name }}</span>
              <span class="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100 font-medium group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
                {{ theme.count }}
              </span>
            </RouterLink>
          </div>
          <div v-else class="text-xs text-slate-400 italic">
            No active themes detected.
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'

const route = useRoute()
const bloomStore = useBloomStore()

// URL Composers
const getBaseReportUrl = () => {
  const org = route.params.orgXid || 'org_1'
  const oType = route.params.offeringType || 'app'
  const oXid = route.params.offeringXid || ''
  const pType = route.params.periodType || 'quarterly'
  const pId = route.params.periodId || '2026q1'
  return `/${org}/reports/${oType}/${oXid}/${pType}/${pId}`
}

const getThemeUrl = (themeId) => `${getBaseReportUrl()}?theme=${themeId}`
const getClassUrl = (classType) => `${getBaseReportUrl()}?class=${classType}`

// Aggregation Engine
const stats = computed(() => {
  const issues = bloomStore.allIssues || []
  
  let backlogIssuesCount = 0
  let backlogInteractionsCount = 0
  let generalIssuesCount = 0
  let generalInteractionsCount = 0
  
  let reachSum = 0
  let reachCount = 0
  let impactSum = 0
  let impactCount = 0
  
  const themeCounts = {}

  issues.forEach(issue => {
    const intCount = issue.interactions?.length || 0
    const isActionable = issue.class === 'backlog-candidate' || (!issue.class && !issue.taxo?.includes('non_issue'))

    if (isActionable) {
      backlogIssuesCount++
      backlogInteractionsCount += intCount
      
      if (issue.rice) {
        if (issue.rice.reach?.value !== undefined) {
          reachSum += issue.rice.reach.value
          reachCount++
        }
        if (issue.rice.impact?.value !== undefined) {
          impactSum += issue.rice.impact.value
          impactCount++
        }
      }
    } else {
      generalIssuesCount++
      generalInteractionsCount += intCount
    }

    if (issue.themes && issue.themes.length > 0) {
      issue.themes.forEach(t => {
        if (!themeCounts[t.themeId]) themeCounts[t.themeId] = { id: t.themeId, name: t.name, count: 0 }
        themeCounts[t.themeId].count += 1 
      })
    }
  })

  const avgReach = reachCount > 0 ? (reachSum / reachCount) : 0
  const avgImpact = impactCount > 0 ? (impactSum / impactCount).toFixed(2) : 0
  const topThemes = Object.values(themeCounts).sort((a, b) => b.count - a.count).slice(0, 4)

  return {
    backlog: { issues: backlogIssuesCount, interactions: backlogInteractionsCount },
    general: { issues: generalIssuesCount, interactions: generalInteractionsCount },
    rice: { avgReach, avgImpact },
    topThemes
  }
})

const formattedNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}
</script>