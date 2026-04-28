<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-bold text-slate-900">7-Day Monitor</h2>
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cross-Portfolio</span>
    </div>
    
    <div class="flex flex-col gap-3" :class="{ 'opacity-50 transition-opacity': homeStore.isTrendingLoading }">
      
      <template v-if="homeStore.trendingIssuesData.length > 0">
        <div 
          v-for="issue in visibleTrendingIssues" 
          :key="issue.issueId"
          @click="navigateToIssue(issue)"
          :class="[
            'bg-white rounded-2xl p-4 flex flex-col transition-all',
            getIssueRoute(issue) ? 'cursor-pointer border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md' : 'border border-slate-100 shadow-sm'
          ]"
        >
          <div class="flex items-center justify-between mb-2.5 gap-2">
            <div class="flex items-center gap-2 overflow-hidden">
              <div class="w-5 h-5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                {{ issue.rank }}
              </div>
              <img v-if="issue.icon" :src="issue.icon" class="w-3.5 h-3.5 rounded-sm shrink-0" />
              <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                {{ issue.offeringName }}
              </span>
            </div>
            
            <div v-if="issue.impactBadge === 'HIGH IMPACT'" class="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              HIGH
            </div>
            <div v-else class="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              {{ issue.impactBadge.replace(' IMPACT', '') }}
            </div>
          </div>

          <h3 class="text-[14px] font-bold text-slate-900 leading-snug mb-1">
            {{ issue.title }}
          </h3>
          
          <div class="flex items-center gap-2 mb-2">
            <div class="flex items-center gap-1">
              <span class="text-[11px] font-bold text-slate-700">{{ formatCompactNumber(Number(issue.recentVolume)) }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interactions</span>
            </div>
            <span class="text-[9px] text-slate-300">&bull;</span>
            <span class="text-[10px] font-medium text-slate-400">
              {{ getTimeAgo(issue.latestInteractionTs, 'Latest Interaction') }}
            </span>
          </div>

          <p class="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
            {{ issue.summary }}
          </p>
        </div>
      </template>

      <div v-else-if="!homeStore.isTrendingLoading" class="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-center text-center">
        <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h4 class="text-sm font-bold text-slate-900 mb-1">All Streams Healthy</h4>
        <p class="text-[11px] text-slate-500 max-w-[180px] mx-auto leading-relaxed">
          No high-velocity backlog candidates detected in the past 7 days.
        </p>
      </div>

      <template v-else>
        <div v-for="i in 5" :key="'skeleton-'+i" class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col opacity-50 pointer-events-none animate-pulse">
          <div class="flex items-center justify-between mb-2.5 gap-2">
            <div class="flex items-center gap-2.5 w-2/3">
              <div class="w-5 h-5 rounded-full bg-slate-100 shrink-0"></div>
              <div class="w-3.5 h-3.5 rounded-sm bg-slate-100 shrink-0"></div>
              <div class="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div class="h-4 w-12 bg-amber-50 rounded"></div>
          </div>
          <div class="h-4 bg-slate-300 rounded w-5/6 mb-1.5"></div>
          <div class="flex items-center gap-2 mb-2.5">
            <div class="h-2.5 bg-slate-200 rounded w-16"></div>
            <div class="w-1 h-1 rounded-full bg-slate-200"></div>
            <div class="h-2.5 bg-slate-200 rounded w-20"></div>
          </div>
          <div class="h-2.5 bg-slate-200 rounded w-full mb-1"></div>
          <div class="h-2.5 bg-slate-200 rounded w-3/4"></div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useHomeStore } from '@/stores/home'
import { formatCompactNumber, getTimeAgo } from '@/library/utils'

const router = useRouter()
const appStore = useAppStore()
const homeStore = useHomeStore()

const unprocessedOfferingsCount = computed(() => {
  return (homeStore.portfolioData || []).filter(o => !o.latestBloomKey).length
})

const visibleTrendingIssues = computed(() => {
  const limit = unprocessedOfferingsCount.value === 0 ? 3 : 5;

  return homeStore.trendingIssuesData.slice(0, limit);
})

const getIssueRoute = (issue) => {
  const portfolioItem = homeStore.portfolioData.find(p => p.offeringXid === issue.offeringXid);
  if (!portfolioItem || !portfolioItem.latestBloomKey) return null;
  
  return `/${appStore.orgXid}/reports/${portfolioItem.offeringType}/${portfolioItem.offeringXid}/${portfolioItem.latestBloomType}/${portfolioItem.latestBloomKey}?taxo=${issue.taxo}&exploreIssue=${issue.taxo}`;
}

const navigateToIssue = (issue) => {
  const route = getIssueRoute(issue);
  if (route) router.push(route);
}
</script>