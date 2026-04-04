<template>
  <div class="flex flex-col w-full">
    
    <div class="flex items-center justify-between mb-4 px-1">
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">Top Issues</h3>
        <span class="text-xs font-medium text-slate-500 mt-0.5">Current period</span>
      </div>
      <RouterLink :to="getReportUrl()" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
        View All Issues
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      
      <RouterLink 
        v-for="(issue, index) in topIssues" 
        :key="issue.id"
        :to="getIssueUrl(issue.taxo)"
        :class="[
          'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex-col cursor-pointer',
          index === 3 ? 'hidden md:flex lg:hidden' : 'flex' // <-- The pure CSS responsive fix!
        ]"
      >
        <div class="flex items-center justify-between mb-3 gap-3">
          <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-1 min-w-0">
            <span class="flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
              {{ index + 1 }}
            </span>
            <span class="truncate" :title="getContextPath(issue)">{{ getContextPath(issue) }}</span>
          </div>
          <div v-if="issue.rice?.impact?.value > 1" class="shrink-0 flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            High Impact
          </div>
        </div>

        <div class="flex-1 flex flex-col mb-4">
          <h4 class="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2" :title="issue.title">
            {{ issue.title }}
          </h4>
          <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {{ issue.description?.summary || 'No summary available.' }}
          </p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 leading-none">{{ formattedNumber(issue.interactions?.length || 0) }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Reviews</span>
            </div>
          </div>
          <span class="text-[10px] font-medium text-slate-400">
            Updated {{ timeAgo(issue.updatedAt) }}
          </span>
        </div>
      </RouterLink>

      <div v-if="topIssues.length === 0" class="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-slate-400">
        <span class="text-2xl mb-2">🎉</span>
        <span class="text-sm font-semibold">No critical top issues detected.</span>
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

// --- DATA ENGINE ---
const topIssues = computed(() => {
  const all = bloomStore.allIssues || []
  
  const filtered = all.filter(issue => {
    return issue.themes && issue.themes.some(t => t.themeId === 'top-issue')
  })

  const sorted = filtered.sort((a, b) => (b.interactions?.length || 0) - (a.interactions?.length || 0))

  // Sliced to 4 to feed our responsive CSS layout!
  return sorted.slice(0, 4)
})

// --- HELPERS & FORMATTERS ---
const getContextPath = (issue) => {
  if (!issue.taxo) return 'Unknown Area'
  const parts = issue.taxo.split(':')
  const cat = issue.categoryTitle || parts[0]
  const top = issue.topicTitle || parts[1]
  return top ? `${cat} › ${top}` : cat
}

const formattedNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}

const timeAgo = (dateString) => {
  if (!dateString) return 'recently'
  const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

// --- ROUTING COMPOSERS ---
const getBaseReportUrl = () => {
  const org = route.params.orgXid || 'org_1'
  const oType = route.params.offeringType || 'app'
  const oXid = route.params.offeringXid || ''
  const pType = route.params.periodType || 'quarterly'
  const pId = route.params.periodId || '2026q1'
  return `/${org}/reports/${oType}/${oXid}/${pType}/${pId}`
}

const getReportUrl = () => getBaseReportUrl()

const getIssueUrl = (taxo) => {
  return `${getBaseReportUrl()}?exploreIssue=${taxo}`
}
</script>