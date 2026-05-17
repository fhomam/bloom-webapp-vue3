<template>
  <div class="bg-slate-50 min-h-screen pb-20">
    <div class="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">

      <div class="flex flex-col gap-1 mb-8">
        <span class="text-[11px] font-extrabold text-bloom-primary uppercase tracking-[0.2em]">Command Center</span>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Organization Overview
        </h1>
      </div>

      <HomeViewStats class="mb-10" />

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <HomeViewMonitor class="lg:col-span-1" />
        <HomeViewOfferings class="lg:col-span-1 xl:col-span-2" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useHomeStore } from '@/stores/home'
import HomeViewStats from '@/components/home/HomeViewStats.vue'
import HomeViewOfferings from '@/components/home/HomeViewOfferings.vue'
import HomeViewMonitor from '@/components/home/HomeViewMonitor.vue'

const appStore = useAppStore()
const homeStore = useHomeStore()

onMounted(() => {
  const payload = { orgXid: appStore.orgXid }
  homeStore.loadPulseData(payload)
  homeStore.loadPortfolioData(payload)
  homeStore.loadTrendingIssues(payload)
})
</script>