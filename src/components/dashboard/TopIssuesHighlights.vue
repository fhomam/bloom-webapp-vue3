<template>
  <div class="flex flex-col w-full">
    
    <div class="flex items-center justify-between mb-4 px-1">
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">Top Issues</h3>
        <span class="text-xs font-medium text-slate-500 mt-0.5">Current period</span>
      </div>
      <RouterLink :to="viewAllTopIssuesRoute" class="text-xs font-bold text-bloom-primary hover:text-bloom-mono transition-colors flex items-center gap-1">
        View All Top Issues
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      
      <RouterLink 
        v-for="(issue, index) in topIssues" 
        :key="issue.id"
        :to="issueRouteFor(issue)"
        :class="[
          'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-bloom-primary/30 transition-all group flex-col cursor-pointer',
          index === 3 ? 'hidden md:flex lg:hidden' : 'flex' 
        ]"
      >
        <div class="flex items-center justify-between mb-3 gap-3">
          <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-1 min-w-0">
            <span class="flex shrink-0 items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-bloom-primary/10 group-hover:text-bloom-primary transition-colors">
              {{ index + 1 }}
            </span>
            <span class="truncate" :title="getContextPath(issue)">{{ issue.breadcrumb.topicTitle }}</span>
          </div>
          <div v-if="issue.rice?.impact?.value > 1" class="shrink-0 flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
            <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            High Impact
          </div>
        </div>

        <div class="flex-1 flex flex-col mb-4">
          <h4 class="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-bloom-primary transition-colors line-clamp-2" :title="issue.title">
            {{ issue.title }}
          </h4>
          <p class="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {{ issue.description?.summary || 'No summary available.' }}
          </p>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-800 leading-none">{{ formattedNumber(issue.interactionsCount || 0) }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Interactions</span>
            </div>
          </div>
          <span class="text-[10px] font-medium text-slate-400">
            {{ getLatestInteractionDate(issue) }}
          </span>
        </div>
      </RouterLink>

      <div v-if="topIssues.length === 0" class="col-span-full bg-white rounded-2xl border border-slate-200 border-dashed p-8 flex flex-col items-center justify-center text-slate-400">
        <span class="text-2xl mb-2">📥</span>
        <span class="text-sm font-semibold">Top will appear here once compiled.</span>
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
// Backend pre-shapes the array (filtered, flattened, sorted by
// topIssueScore). We just slice the top 4 for the UI.
const topIssues = computed(() => {
  const tIssues = bloomStore.topIssues || []
  return tIssues.slice(0, 4)
})

// --- HELPERS & FORMATTERS ---
const getContextPath = (issue) => {
  if (issue.breadcrumb) {
    const cat = issue.breadcrumb.categoryTitle
    const top = issue.breadcrumb.topicTitle
    if (cat && top) return `${cat} › ${top}`
    if (cat) return cat
  }
  if (!issue.taxo) return 'Unknown Area'
  const parts = issue.taxo.split(':')
  return parts.length > 1 ? `${parts[0]} › ${parts[1]}` : parts[0]
}

const formattedNumber = (num) => {
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}

const getLatestInteractionDate = (issue) => {
  if (!issue.latestInteraction) return 'No interactions'
  const dateObj = new Date(issue.latestInteraction)
  if (isNaN(dateObj.getTime())) return 'Unknown date'
  return `Latest: ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
}

// --- NAVIGATION TO BLOOM REPORT ---
// We're on the dashboard route, building links to the report route.
// Plain router-object form, no dashboard route.query carry-over —
// these top issues are compiled period-wide and independent of any
// active dashboard filters. The report URL contract is documented in
// docs/bloom-report-url-state.md.

const reportPath = computed(() => {
  const { orgXid, offeringType, offeringXid, periodType, periodId } = route.params
  if (!orgXid || !offeringXid || !periodId) return null
  return `/${orgXid}/reports/${offeringType}/${offeringXid}/${periodType}/${periodId}`
})

// "View All Top Issues" — filters the main report list to the
// top-issue theme. No panel; the user wants to see the cards.
const viewAllTopIssuesRoute = computed(() => {
  if (!reportPath.value) return ''
  return {
    path: reportPath.value,
    query: { theme: 'top-issue' }
  }
})

// Per-card click — opens the interactions panel scoped to that issue,
// with issue-bits highlighted. Uses `forIssue` so the main list isn't
// filtered to a single card; the user can still browse around.
const issueRouteFor = (issue) => {
  if (!reportPath.value || !issue?.taxo) return ''
  return {
    path: reportPath.value,
    query: {
      forIssue: issue.taxo,
      panel: 'interactions',
      hl: 'issue'
    }
  }
}
</script>