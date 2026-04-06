<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col w-full">
    
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">Channel Breakdown</h3>
        <span class="text-xs font-medium text-slate-500 mt-0.5">Volume and packet breakdown across channels and regions</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      
      <div class="flex flex-col">
        <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">By Source</h4>
        <div class="h-[200px] w-full relative mb-2">
          <v-chart class="absolute inset-0 w-full h-full" :option="getPieOption(sourceStats, 'Source')" autoresize />
        </div>
        <div class="flex flex-col gap-1.5">
          <div v-for="(item, index) in sourceStats" :key="item.name" class="flex items-center text-sm group">
            <div class="flex items-center gap-2 truncate">
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: colorPalette[index % colorPalette.length] }"></div>
              <span class="font-medium text-slate-600 truncate group-hover:text-slate-900 transition-colors" :title="item.name">{{ item.name }}</span>
            </div>
            <div class="flex-1 border-b-[1.5px] border-dotted border-slate-200 mx-3 translate-y-[4px]"></div>
            <span class="font-bold text-slate-800 shrink-0">{{ formattedNumber(item.volume) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">By Country</h4>
        <div class="h-[200px] w-full relative mb-2">
          <v-chart class="absolute inset-0 w-full h-full" :option="getPieOption(countryStats, 'Country')" autoresize />
        </div>
        <div class="flex flex-col gap-1.5">
          <div v-for="(item, index) in countryStats" :key="item.name" class="flex items-center text-sm group">
            <div class="flex items-center gap-2 truncate">
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: colorPalette[index % colorPalette.length] }"></div>
              <span class="font-medium text-slate-600 truncate group-hover:text-slate-900 transition-colors" :title="item.name">{{ item.name }}</span>
            </div>
            <div class="flex-1 border-b-[1.5px] border-dotted border-slate-200 mx-3 translate-y-[4px]"></div>
            <span class="font-bold text-slate-800 shrink-0">{{ formattedNumber(item.volume) }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <h4 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">By App Version</h4>
        <div class="h-[200px] w-full relative mb-2">
          <v-chart class="absolute inset-0 w-full h-full" :option="getPieOption(versionStats, 'Version')" autoresize />
        </div>
        <div class="flex flex-col gap-1.5">
          <div v-for="(item, index) in versionStats" :key="item.name" class="flex items-center text-sm group">
            <div class="flex items-center gap-2 truncate">
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: colorPalette[index % colorPalette.length] }"></div>
              <span class="font-medium text-slate-600 truncate group-hover:text-slate-900 transition-colors" :title="item.name">{{ item.name }}</span>
            </div>
            <div class="flex-1 border-b-[1.5px] border-dotted border-slate-200 mx-3 translate-y-[4px]"></div>
            <span class="font-bold text-slate-800 shrink-0">{{ formattedNumber(item.volume) }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, TooltipComponent])

const bloomStore = useBloomStore()

// A clean, vibrant palette for the donut slices
const colorPalette = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9']

// Formatters
const formattedNumber = (num) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)

const formatSource = (src) => {
  if (!src) return 'Unknown'
  if (src === 'apple_app_store') return 'App Store'
  if (src === 'google_play') return 'Google Play'
  return src
}

const formatCountry = (code) => {
  if (!code || code === 'default') return 'Unknown'
  return code.toUpperCase()
}

// --- UNIVERSAL BUCKETING ENGINE ---
const getDistributionData = (dimensionKey, nameFormatter, limit = 5) => {
  const issues = bloomStore.allIssues || []
  const buckets = {}

  issues.forEach(issue => {
    if (!issue.interactions) return

    const isActionable = issue.class === 'backlog-candidate' || (!issue.class && !issue.taxo?.includes('non_issue'))

    issue.interactions.forEach(interaction => {
      const rawValue = interaction[dimensionKey]
      const key = rawValue || 'unknown'

      if (!buckets[key]) {
        buckets[key] = { volume: 0, actionableSet: new Set(), generalSet: new Set() }
      }

      buckets[key].volume += 1

      if (isActionable) {
        buckets[key].actionableSet.add(issue.id)
      } else {
        buckets[key].generalSet.add(issue.id)
      }
    })
  })

  return Object.keys(buckets)
    .map(key => {
      const b = buckets[key]
      return {
        name: nameFormatter(key),
        volume: b.volume,
        actionable: b.actionableSet.size,
        general: b.generalSet.size
      }
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
}

// --- REACTIVE BINDINGS ---
const sourceStats = computed(() => getDistributionData('sourceId', formatSource))
const countryStats = computed(() => getDistributionData('country', formatCountry))
const versionStats = computed(() => getDistributionData('entityVersion', (v) => v === 'unknown' ? 'Unknown Version' : v))

// --- ECHARTS DONUT CONFIGURATION ---
const getPieOption = (dataList, seriesName) => {
  return {
    color: colorPalette,
    tooltip: {
      trigger: 'item',
      position: function (point, params, dom, rect, size) {
        let x = point[0] + 15;
        let y = point[1] + 15;
        // If it bleeds off the right edge, flip it to the left side of the cursor
        if (x + size.contentSize[0] > size.viewSize[0]) {
          x = point[0] - size.contentSize[0] - 15;
        }
        // If it bleeds off the left edge (or on super small screens), pin it to the left
        if (x < 10) x = 10;
        return [x, y];
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      padding: 0,
      extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; pointer-events: none;',
      formatter: (params) => {
        const d = params.data
        return `
          <div class="flex flex-col min-w-[200px]">
            <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" style="background-color: ${params.color}"></div>
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">${d.name}</span>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div class="flex items-end justify-between">
                <span class="text-sm font-semibold text-slate-700">Total Volume</span>
                <span class="text-lg font-black leading-none text-slate-900">${new Intl.NumberFormat('en-US').format(d.value)}</span>
              </div>
              <div class="flex flex-col gap-1 text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2 mt-1">
                <div class="flex justify-between"><span>Backlog Candidates</span> <span class="text-indigo-600 font-bold">${d.actionable}</span></div>
                <div class="flex justify-between"><span>General Feedback</span> <span class="text-slate-700 font-bold">${d.general}</span></div>
              </div>
            </div>
          </div>
        `
      }
    },
    series: [
      {
        name: seriesName,
        type: 'pie',
        radius: ['50%', '80%'], 
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        // Turn off default global labels, we handle it individually in the data mapping
        label: { show: false }, 
        data: dataList.map((item, index) => ({
          name: item.name,
          value: item.volume,
          actionable: item.actionable,
          general: item.general,
          // Only show the visual guide line and text for the #1 item
          label: {
            show: index === 0,
            formatter: '{b}',
            color: '#475569',
            fontSize: 10,
            fontWeight: 600
          },
          labelLine: {
            show: index === 0,
            length: 12,
            length2: 16,
            smooth: true,
            lineStyle: { color: '#cbd5e1', width: 1.5 }
          }
        }))
      }
    ]
  }
}
</script>