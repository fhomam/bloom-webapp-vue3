<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">

    <!-- Fused on <lg: Processed (flips to show Available for backfill discovery) -->
    <HomeViewStatCard
      class="lg:hidden"
      label="Processed"
      sub-label="Week / Total"
      :primary-value="homeStore.pulseData.weeklyProcessedInteractions"
      :secondary-value="homeStore.pulseData.totalAnalyzedInteractions"
      :icon-path="ICONS.bolt"
      :icon-stroke-width="2.5"
      icon-bg-class="bg-indigo-50"
      icon-text-class="text-indigo-500"
      :change="weeklyChange"
      :loading="homeStore.isPulseLoading"
      flippable
      back-label="Available"
      back-sub-label="Analyzed / Collected"
      :back-primary-value="homeStore.pulseData.totalAnalyzedInteractions"
      :back-secondary-value="homeStore.pulseData.totalAvailableInteractions"
    />

    <!-- Fused on <lg: Coverage (flips to show Last Received) -->
    <HomeViewStatCard
      class="lg:hidden"
      label="Coverage"
      sub-label="Offerings / Sources"
      :primary-value="homeStore.pulseData.activeOfferingsCount"
      :secondary-value="homeStore.pulseData.syncingSourcesCount"
      :icon-path="ICONS.grid"
      icon-bg-class="bg-emerald-50"
      icon-text-class="text-emerald-500"
      :sync-status="syncStatus"
      :loading="homeStore.isPulseLoading"
      flippable
      back-label="Last Received"
      :back-primary-value="lastReceived.value"
      :back-unit="lastReceived.unit"
      back-primary-raw
      back-icon-bg-class="bg-slate-50"
      back-icon-text-class="text-slate-400"
    />

    <!-- lg+: 4 split cards -->
    <HomeViewStatCard
      class="hidden lg:flex"
      label="Total Processed"
      :primary-value="homeStore.pulseData.totalAnalyzedInteractions"
      unit="Interactions"
      :icon-path="ICONS.bolt"
      :icon-stroke-width="2.5"
      icon-bg-class="bg-indigo-50"
      icon-text-class="text-indigo-500"
      :loading="homeStore.isPulseLoading"
      flippable
      back-label="Available to Analyze"
      :back-primary-value="homeStore.pulseData.totalAvailableInteractions"
      back-unit="Interactions"
    />
    <HomeViewStatCard
      class="hidden lg:flex"
      label="This Week"
      :primary-value="homeStore.pulseData.weeklyProcessedInteractions"
      unit="Interactions"
      :icon-path="ICONS.clock"
      icon-bg-class="bg-sky-50"
      icon-text-class="text-sky-500"
      :change="weeklyChange"
      :loading="homeStore.isPulseLoading"
    />
    <HomeViewStatCard
      class="hidden lg:flex"
      label="Monitoring"
      :primary-value="homeStore.pulseData.activeOfferingsCount"
      unit="Offerings"
      :icon-path="ICONS.grid"
      icon-bg-class="bg-emerald-50"
      icon-text-class="text-emerald-500"
      :loading="homeStore.isPulseLoading"
    />
    <HomeViewStatCard
      class="hidden lg:flex"
      label="Sources"
      :primary-value="homeStore.pulseData.syncingSourcesCount"
      :icon-path="ICONS.link"
      icon-bg-class="bg-amber-50"
      icon-text-class="text-amber-500"
      :sync-status="syncStatus"
      :loading="homeStore.isPulseLoading"
      flippable
      back-label="Last Received"
      :back-primary-value="lastReceived.value"
      :back-unit="lastReceived.unit"
      back-primary-raw
      back-icon-bg-class="bg-slate-50"
      back-icon-text-class="text-slate-400"
    />

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHomeStore } from '@/stores/home'
import HomeViewStatCard from '@/components/home/HomeViewStatCard.vue'

const homeStore = useHomeStore()

const ICONS = {
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
}

// Weekly change pill
const weeklyChange = computed(() => {
  const raw = homeStore.pulseData.weeklyProcessedChangePercent
  if (raw === null || raw === undefined || raw === '') return { show: false }
  const pct = Number(raw)
  if (isNaN(pct)) return { show: false }

  const sign = pct > 0 ? '+' : ''
  const label = `${sign}${Math.round(pct)}%`

  let classes
  if (pct > 0) classes = 'bg-emerald-50 text-emerald-700'
  else if (pct < 0) classes = 'bg-rose-50 text-rose-700'
  else classes = 'bg-slate-100 text-slate-500'

  return { show: true, label, classes }
})

// Sources sync status
const syncStatus = computed(() => {
  const total = Number(homeStore.pulseData.syncingSourcesCount) || 0
  const failed = Number(homeStore.pulseData.failedSourcesCount) || 0

  if (total === 0 && failed > 0) {
    return { label: 'Failed', pingColor: 'bg-rose-400', dotColor: 'bg-rose-500' }
  } else if (failed > 0) {
    return { label: 'Degraded', pingColor: 'bg-amber-400', dotColor: 'bg-amber-500' }
  } else {
    return { label: 'Syncing', pingColor: 'bg-emerald-400', dotColor: 'bg-emerald-500' }
  }
})

// "Last received" formatted as a compact primary value (e.g. "23m") + unit ("ago")
// Splitting value/unit lets the big number style stay on the duration and the small unit text style stay on "ago".
const lastReceived = computed(() => {
  const ts = homeStore.pulseData.lastSyncTimestamp
  if (!ts) return { value: '—', unit: '' }
  const then = new Date(ts).getTime()
  if (isNaN(then)) return { value: '—', unit: '' }

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return { value: 'Now', unit: '' }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return { value: `${diffMin}m`, unit: 'ago' }

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return { value: `${diffHr}h`, unit: 'ago' }

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return { value: `${diffDay}d`, unit: 'ago' }

  const diffMo = Math.floor(diffDay / 30)
  return { value: `${diffMo}mo`, unit: 'ago' }
})
</script>