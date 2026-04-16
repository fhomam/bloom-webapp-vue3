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
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Collected</span>
          <div class="flex items-baseline gap-2" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
            <span class="text-4xl font-extrabold text-slate-900 tracking-tight">
              {{ formatCompactNumber(Number(homeStore.pulseData.totalAvailableInteractions)) }}
            </span>
            <span class="text-xs font-semibold text-slate-500">Interactions</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div class="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-10"></div>
          <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            AI Processed
          </span>
          <div class="flex items-baseline gap-2 z-10" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
            <span class="text-4xl font-extrabold text-indigo-900 tracking-tight">
              {{ formatCompactNumber(Number(homeStore.pulseData.totalAnalyzedInteractions)) }}
            </span>
            <span class="text-xs font-semibold text-indigo-500">Interactions</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monitored Offerings</span>
          <div class="flex items-baseline gap-2" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
            <span class="text-4xl font-extrabold text-slate-900 tracking-tight">
              {{ formatCompactNumber(Number(homeStore.pulseData.activeOfferingsCount)) }}
            </span>
            <span class="text-xs font-semibold text-slate-500">Active</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sources</span>
          <div class="flex items-baseline gap-2" :class="{ 'opacity-50 transition-opacity': homeStore.isPulseLoading }">
            <span class="text-4xl font-extrabold text-slate-900 tracking-tight">
              {{ formatCompactNumber(Number(homeStore.pulseData.syncingSourcesCount)) }}
            </span>
            <span class="text-xs font-semibold text-slate-500">Syncing</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div class="xl:col-span-2 flex flex-col gap-8">
          
          <div v-if="processedOfferings.length > 0" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900">
                Active Portfolios <span class="text-slate-400 font-normal ml-1">({{ processedOfferings.length }})</span>
              </h2>
              
              <div v-if="totalPages > 1" class="flex items-center gap-2">
                <button @click="prevPage" :disabled="currentPage === 0" class="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ currentPage + 1 }} / {{ totalPages }}</span>
                <button @click="nextPage" :disabled="currentPage >= totalPages - 1" class="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" :class="{ 'opacity-50 transition-opacity': homeStore.isPortfolioLoading }">
              <div v-for="offering in paginatedProcessed" :key="offering.offeringXid" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full relative overflow-hidden">
                <div class="flex items-start justify-between mb-5">
                  <div class="flex flex-col pr-4">
                    <h3 class="text-lg font-bold text-slate-900 truncate" :title="offering.offeringXid">
                      {{ offering.name || offering.offeringXid }}
                    </h3>
                    <span class="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                      {{ offering.offeringType }} &bull; LATEST: {{ offering.latestBloomKey }}
                    </span>
                  </div>
                  
                  <img v-if="offering.icon" :src="offering.icon" :alt="offering.name" class="w-11 h-11 rounded-xl border border-slate-100 shadow-sm shrink-0 object-cover" />
                  <div v-else class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <span class="text-slate-400 text-xs font-bold">{{ (offering.name) ? offering.name.charAt(0) : 'X' }}</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="flex flex-col border-l-[3px] border-emerald-400 pl-3">
                    <span class="text-2xl font-extrabold text-slate-900 leading-none">{{ offering.joyScore }}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Joy Score</span>
                  </div>
                  <div class="flex flex-col border-l-2 border-slate-200 pl-3 justify-center">
                    <div class="flex items-baseline gap-1.5 leading-none mb-1">
                      <span class="text-lg font-bold text-indigo-600">{{ formatCompactNumber(Number(offering.interactionsAnalyzed)) }}</span>
                      <span class="text-[11px] font-semibold text-slate-400">/ {{ formatCompactNumber(Number(offering.interactionsAvailable)) }}</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interactions Processed</span>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-5 border-t border-slate-100 mt-auto">
                  <RouterLink :to="`/${appStore.orgXid}/dashboard/${offering.offeringType}/${offering.offeringXid}/${offering.latestBloomType}/${offering.latestBloomKey}`" class="flex-1 py-2 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                    Dashboard
                  </RouterLink>
                  <RouterLink :to="`/${appStore.orgXid}/reports/${offering.offeringType}/${offering.offeringXid}/${offering.latestBloomType}/${offering.latestBloomKey}`" class="flex-1 py-2 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                    Report
                  </RouterLink>
                  
                  <button v-if="offering.interactionsAvailable > offering.interactionsAnalyzed" class="w-full mt-2 py-2 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Run Analysis ({{ formatCompactNumber(Number(offering.interactionsAvailable) - Number(offering.interactionsAnalyzed)) }} Pending)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="homeStore.isPortfolioLoading || homeStore.portfolioData.length === 0" class="flex flex-col gap-4">
             <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900">Active Portfolios</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-full opacity-50 pointer-events-none animate-pulse">
                <div class="flex items-start justify-between mb-5">
                  <div class="flex flex-col gap-2 w-full pr-8">
                    <div class="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-2 bg-slate-100 rounded w-1/2 mt-1"></div>
                  </div>
                  <div class="w-11 h-11 rounded-xl bg-slate-100 shrink-0"></div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6 mt-2">
                  <div class="flex flex-col border-l-[3px] border-slate-100 pl-3 gap-1.5">
                    <div class="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div class="h-2 bg-slate-100 rounded w-1/3"></div>
                  </div>
                  <div class="flex flex-col border-l-2 border-slate-100 pl-3 justify-center gap-1.5">
                    <div class="h-5 bg-slate-200 rounded w-2/3"></div>
                    <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="unprocessedOfferings.length > 0" class="flex flex-col gap-4 border-t border-slate-200 pt-6">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900">
                Awaiting Analysis <span class="text-slate-400 font-normal ml-1">({{ unprocessedOfferings.length }})</span>
              </h2>
              
              <div v-if="totalPagesUnprocessed > 1" class="flex items-center gap-2">
                <button @click="prevUnprocessedPage" :disabled="currentPageUnprocessed === 0" class="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ currentPageUnprocessed + 1 }} / {{ totalPagesUnprocessed }}</span>
                <button @click="nextUnprocessedPage" :disabled="currentPageUnprocessed >= totalPagesUnprocessed - 1" class="w-7 h-7 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" :class="{ 'opacity-50 transition-opacity': homeStore.isPortfolioLoading }">
              <div v-for="offering in paginatedUnprocessed" :key="offering.offeringXid" class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 shadow-sm flex flex-col h-full relative">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex flex-col pr-4">
                    <h3 class="text-lg font-bold text-slate-600 truncate" :title="offering.offeringXid">
                      {{ offering.name || offering.offeringXid }}
                    </h3>
                    <span class="text-[10px] font-bold text-rose-400 mt-0.5 uppercase tracking-wider">
                      {{ offering.offeringType }} &bull; No Reports Generated
                    </span>
                  </div>
                  <img v-if="offering.icon" :src="offering.icon" :alt="offering.name" class="w-11 h-11 rounded-xl border border-slate-100 shadow-sm shrink-0 object-cover opacity-80" />
                  <div v-else class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <span class="text-slate-400 text-xs font-bold">{{ (offering.name) ? offering.name.charAt(0) : 'X' }}</span>
                  </div>
                </div>

                <div class="mb-6">
                  <div class="flex items-end gap-1.5 leading-none mb-1.5">
                    <span class="text-2xl font-extrabold text-slate-600">{{ formatCompactNumber(Number(offering.interactionsAvailable)) }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interactions Collected</span>
                </div>

                <div class="mt-auto pt-5 border-t border-slate-100">
                  <button class="w-full py-2 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Run Initial Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else-if="homeStore.isPortfolioLoading || homeStore.portfolioData.length === 0" class="flex flex-col gap-4 border-t border-slate-200 pt-6">
             <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900">Awaiting Analysis</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="i in 2" :key="i" class="bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm flex flex-col h-full relative opacity-50 pointer-events-none animate-pulse">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex flex-col gap-2 w-full pr-8">
                    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                  </div>
                  <div class="w-11 h-11 rounded-xl bg-slate-100 shrink-0"></div>
                </div>
                <div class="mb-5 mt-4">
                  <div class="h-6 bg-slate-200 rounded w-1/4 mb-2"></div>
                  <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-1 flex flex-col gap-4">
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
                  'bg-white rounded-2xl p-4 flex flex-col transition-all', // 🔥 Tweak 3: Softened borders
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
                    {{ getTimeAgo(issue.updatedAt, 'Updated') }}
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

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useHomeStore } from '@/stores/home'
import { formatNumber, formatCompactNumber, getTimeAgo } from '@/library/utils'

const router = useRouter()
const appStore = useAppStore()
const homeStore = useHomeStore()

// --- Data Sorting & Grouping ---
const processedOfferings = computed(() => {
  return (homeStore.portfolioData || []).filter(o => o.latestBloomKey)
})

const unprocessedOfferings = computed(() => {
  return (homeStore.portfolioData || []).filter(o => !o.latestBloomKey)
})

// --- Dynamic Trending Issues Layout ---
const visibleTrendingIssues = computed(() => {
  const limit = unprocessedOfferings.value.length === 0 ? 3 : 5;
  return homeStore.trendingIssuesData.slice(0, limit);
})

// --- Routing Helper for Trending Issues ---
const getIssueRoute = (issue) => {
  const portfolioItem = homeStore.portfolioData.find(p => p.offeringXid === issue.offeringXid);
  if (!portfolioItem || !portfolioItem.latestBloomKey) return null;
  
  // 🔥 Tweak 6: Used issue.taxo instead of issueId
  return `/${appStore.orgXid}/reports/${portfolioItem.offeringType}/${portfolioItem.offeringXid}/${portfolioItem.latestBloomType}/${portfolioItem.latestBloomKey}?taxo=${issue.taxo}&exploreIssue=${issue.taxo}`;
}

const navigateToIssue = (issue) => {
  const route = getIssueRoute(issue);
  if (route) router.push(route);
}

// --- Pagination Logic (Active Portfolios) ---
const itemsPerPage = 4
const currentPage = ref(0)
const totalPages = computed(() => Math.ceil(processedOfferings.value.length / itemsPerPage))
const paginatedProcessed = computed(() => {
  const start = currentPage.value * itemsPerPage
  return processedOfferings.value.slice(start, start + itemsPerPage)
})
const nextPage = () => { if (currentPage.value < totalPages.value - 1) currentPage.value++ }
const prevPage = () => { if (currentPage.value > 0) currentPage.value-- }

// --- Pagination Logic (Awaiting Analysis) ---
const itemsPerPageUnprocessed = 2
const currentPageUnprocessed = ref(0)
const totalPagesUnprocessed = computed(() => Math.ceil(unprocessedOfferings.value.length / itemsPerPageUnprocessed))
const paginatedUnprocessed = computed(() => {
  const start = currentPageUnprocessed.value * itemsPerPageUnprocessed
  return unprocessedOfferings.value.slice(start, start + itemsPerPageUnprocessed)
})
const nextUnprocessedPage = () => { if (currentPageUnprocessed.value < totalPagesUnprocessed.value - 1) currentPageUnprocessed.value++ }
const prevUnprocessedPage = () => { if (currentPageUnprocessed.value > 0) currentPageUnprocessed.value-- }

// --- Lifecycle Initialization ---
onMounted(() => {
  const payload = { orgXid: appStore.orgXid }
  homeStore.loadPulseData(payload)
  homeStore.loadPortfolioData(payload)
  homeStore.loadTrendingIssues(payload) 
})
</script>