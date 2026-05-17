<template>
  <div class="flex flex-col gap-8">

    <!-- ========== Active Offerings (monitoring active) ========== -->
    <div v-if="processedOfferings.length > 0" class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">
          Active Offerings <span class="text-slate-400 font-normal ml-1">({{ processedOfferings.length }})</span>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4" :class="{ 'opacity-50 transition-opacity': homeStore.isPortfolioLoading }">
        <div v-for="offering in paginatedProcessed" :key="offering.offeringXid" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col h-full relative overflow-hidden">

          <!-- Card header: name + offering type + monitoring status + icon -->
          <div class="flex items-start justify-between mb-5 gap-3">
            <div class="flex flex-col min-w-0 flex-1 pr-1">
              <h3 class="text-lg font-bold text-slate-900 line-clamp-2 leading-tight" :title="offering.offeringXid">
                {{ offering.name || offering.offeringXid }}
              </h3>
              <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {{ offering.offeringType }}
                </span>
                <span class="text-slate-300">&bull;</span>
                <span class="flex items-center gap-1.5">
                  <span :class="['inline-block rounded-full h-1.5 w-1.5 shrink-0', monitoringStatusOf(offering).dotClass]"></span>
                  <span :class="['text-[10px] font-bold uppercase tracking-wider', monitoringStatusOf(offering).textClass]">
                    {{ monitoringStatusOf(offering).label }}
                  </span>
                </span>
              </div>
            </div>

            <img v-if="offering.icon" :src="offering.icon" :alt="offering.name" class="w-11 h-11 rounded-xl border border-slate-100 shadow-sm shrink-0 object-cover" />
            <div v-else class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <span class="text-slate-400 text-xs font-bold">{{ (offering.name) ? offering.name.charAt(0) : 'X' }}</span>
            </div>
          </div>

          <!-- Stats: Joy Score + Processed (collapses when caught up) -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="flex flex-col border-l-[3px] border-emerald-400 pl-3">
              <span class="text-2xl font-extrabold text-slate-900 leading-none">{{ offering.joyScore }}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Joy Score</span>
            </div>
            <div class="flex flex-col border-l-2 border-slate-200 pl-3 justify-center">
              <div class="flex items-baseline gap-1.5 leading-none mb-1">
                <span class="text-2xl font-extrabold text-slate-900">{{ formatCompactNumber(Number(offering.interactionsAnalyzed)) }}</span>
                <span v-if="hasBacklog(offering)" class="text-[11px] font-semibold text-slate-400">/ {{ formatCompactNumber(Number(offering.interactionsAvailable)) }}</span>
              </div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed</span>
            </div>
          </div>

          <!-- Primary actions -->
          <div class="flex items-center gap-2 pt-5 border-t border-slate-100 mt-auto">
            <RouterLink :to="`/${appStore.orgXid}/dashboard/${offering.offeringType}/${offering.offeringXid}/${offering.latestBloomType}/${offering.latestBloomKey}`" class="flex-1 py-2 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors">
              Dashboard
            </RouterLink>
            <RouterLink :to="`/${appStore.orgXid}/reports/${offering.offeringType}/${offering.offeringXid}/${offering.latestBloomType}/${offering.latestBloomKey}`" class="flex-1 py-2 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors">
              Report
            </RouterLink>
          </div>

          <!-- Backfill / caught-up slot: fixed height keeps card consistent -->
          <div class="mt-2 h-[34px]">
            <button
              v-if="hasBacklog(offering)"
              class="py-2 w-full h-full flex items-center justify-center gap-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6"></path></svg>
              Backfill {{ formatCompactNumber(backlogCount(offering)) }} Historical
            </button>
            <button
              v-else
              class="py-2 w-full h-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              <span class="inline-block rounded-full h-1.5 w-1.5 shrink-0 bg-emerald-500"></span>
              <span class="text-slate-900">{{ formatCompactNumber(Number(offering.weeklyReceived || 0)) }}</span>
              Received This Week
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== Active Offerings skeleton ========== -->
    <div v-else-if="homeStore.isPortfolioLoading || homeStore.portfolioData.length === 0" class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">Active Offerings</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        <div v-for="i in 2" :key="i" class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-full opacity-50 pointer-events-none animate-pulse">
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

    <!-- ========== Pending Activation (was: Awaiting Analysis) ========== -->
    <div v-if="unprocessedOfferings.length > 0" class="flex flex-col gap-4 border-t border-slate-200 pt-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">
          Pending Activation <span class="text-slate-400 font-normal ml-1">({{ unprocessedOfferings.length }})</span>
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

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4" :class="{ 'opacity-50 transition-opacity': homeStore.isPortfolioLoading }">
        <div v-for="offering in paginatedUnprocessed" :key="offering.offeringXid" class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 shadow-sm flex flex-col h-full relative">

          <div class="flex items-start justify-between mb-4 gap-3">
            <div class="flex flex-col min-w-0 flex-1 pr-1">
              <h3 class="text-lg font-bold text-slate-600 line-clamp-2 leading-tight" :title="offering.offeringXid">
                {{ offering.name || offering.offeringXid }}
              </h3>
              <div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {{ offering.offeringType }}
                </span>
                <span class="text-slate-300">&bull;</span>
                <span class="flex items-center gap-1.5">
                  <span class="inline-block rounded-full h-1.5 w-1.5 shrink-0 bg-amber-400"></span>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Activation</span>
                </span>
              </div>
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
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interactions Available</span>
          </div>

          <div class="mt-auto pt-5 border-t border-slate-100">
            <button class="w-full py-2 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Activate Monitoring
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== Pending Activation skeleton ========== -->
    <div v-else-if="homeStore.isPortfolioLoading || homeStore.portfolioData.length === 0" class="flex flex-col gap-4 border-t border-slate-200 pt-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-900">Pending Activation</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        <div v-for="i in 1" :key="i" class="bg-white rounded-2xl border border-dashed border-slate-200 p-6 shadow-sm flex flex-col h-full relative opacity-50 pointer-events-none animate-pulse">
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
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app'
import { useHomeStore } from '@/stores/home'
import { formatCompactNumber } from '@/library/utils'

const appStore = useAppStore()
const homeStore = useHomeStore()

const processedOfferings = computed(() => {
  return (homeStore.portfolioData || []).filter(o => o.latestBloomKey)
})

const unprocessedOfferings = computed(() => {
  return (homeStore.portfolioData || []).filter(o => !o.latestBloomKey)
})

// --- Monitoring status mapping ---
// Future-proofed: defaults to 'active' when latestBloomKey exists; will read offering.monitoringStatus when wired.
const MONITORING_STATUS = {
  active:   { label: 'Monitoring Active',   dotClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
  paused:   { label: 'Monitoring Paused',   dotClass: 'bg-amber-400',   textClass: 'text-amber-600'   },
  stopped:  { label: 'Monitoring Stopped',  dotClass: 'bg-slate-400',   textClass: 'text-slate-500'   },
  pending:  { label: 'Pending Activation',  dotClass: 'bg-amber-400',   textClass: 'text-amber-600'   },
}
const monitoringStatusOf = (offering) => {
  const status = offering.monitoringStatus || (offering.latestBloomKey ? 'active' : 'pending')
  return MONITORING_STATUS[status] || MONITORING_STATUS.active
}

// --- Backlog helpers ---
const backlogCount = (offering) =>
  Math.max(0, Number(offering.interactionsAvailable || 0) - Number(offering.interactionsAnalyzed || 0))
const hasBacklog = (offering) => backlogCount(offering) > 0

// --- Pagination (Active) ---
const itemsPerPage = 2
const currentPage = ref(0)
const totalPages = computed(() => Math.ceil(processedOfferings.value.length / itemsPerPage))
const paginatedProcessed = computed(() => {
  const start = currentPage.value * itemsPerPage
  return processedOfferings.value.slice(start, start + itemsPerPage)
})
const nextPage = () => { if (currentPage.value < totalPages.value - 1) currentPage.value++ }
const prevPage = () => { if (currentPage.value > 0) currentPage.value-- }

// --- Pagination (Pending Activation) ---
// Page size adapts to viewport: 1 below xl (1280px), 2 at xl+ to match grid columns.
const itemsPerPageUnprocessed = ref(1)
const xlMediaQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)') : null
const updatePendingPageSize = (e) => {
  itemsPerPageUnprocessed.value = e.matches ? 2 : 1
}
if (xlMediaQuery) {
  updatePendingPageSize(xlMediaQuery)
  xlMediaQuery.addEventListener('change', updatePendingPageSize)
  onBeforeUnmount(() => xlMediaQuery.removeEventListener('change', updatePendingPageSize))
}

const currentPageUnprocessed = ref(0)
const totalPagesUnprocessed = computed(() => Math.ceil(unprocessedOfferings.value.length / itemsPerPageUnprocessed.value))
const paginatedUnprocessed = computed(() => {
  const start = currentPageUnprocessed.value * itemsPerPageUnprocessed.value
  return unprocessedOfferings.value.slice(start, start + itemsPerPageUnprocessed.value)
})
const nextUnprocessedPage = () => { if (currentPageUnprocessed.value < totalPagesUnprocessed.value - 1) currentPageUnprocessed.value++ }
const prevUnprocessedPage = () => { if (currentPageUnprocessed.value > 0) currentPageUnprocessed.value-- }
</script>