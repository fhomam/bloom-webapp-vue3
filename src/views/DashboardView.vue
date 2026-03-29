<template>
  <div class="max-w-7xl mx-auto space-y-6">
    
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Executive Overview</h1>
        <p class="text-sm text-slate-500 mt-1">
          <span v-if="bloomStore.offeringContext">{{ bloomStore.offeringContext.name }} • </span> 
          Q1 2026
        </p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Export Report
        </button>
      </div>
    </div>

    <div v-if="bloomStore.isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <svg class="animate-spin h-8 w-8 mb-4 text-bloom-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p class="text-sm font-medium">Analyzing Voice of Customer data...</p>
    </div>

    <div v-else-if="bloomStore.error" class="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl">
      {{ bloomStore.error }}
    </div>

    <template v-else-if="bloomStore.currentBloom && bloomStore.joyStats">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Joy Score</span>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-4xl font-bold text-slate-900">{{ bloomStore.joyStats.score.toFixed(2) }}</span>
            <span :class="['text-sm font-medium', getJoyColor(bloomStore.joyStats.score)]">
              {{ bloomStore.joyStats.scoreDescription }}
            </span>
          </div>
          
          <div class="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden flex" v-if="totalExpressions > 0">
            <div class="h-full bg-bloom-accent2" :style="{ width: getPercentage('joy') + '%' }" title="Joy"></div>
            <div class="h-full bg-bloom-accent1" :style="{ width: getPercentage('confidence') + '%' }" title="Confidence"></div>
            <div class="h-full bg-slate-300" :style="{ width: getPercentage('engagement') + '%' }" title="Engagement"></div>
            <div class="h-full bg-rose-400" :style="{ width: getPercentage('frustration') + '%' }" title="Frustration"></div>
            <div class="h-full bg-rose-600" :style="{ width: getPercentage('hopelessness') + '%' }" title="Hopelessness"></div>
          </div>
          <div class="mt-2 text-xs text-slate-400 text-right">{{ bloomStore.joyStats.metrics.reviewsAnalyzed }} interactions scored</div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Product Market Impedance</span>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-4xl font-bold text-slate-900">{{ bloomStore.pmiStats.percentage }}%</span>
            <span class="text-sm font-medium text-bloom-select">{{ bloomStore.pmiStats.label }}</span>
          </div>
          <p class="mt-4 text-sm text-slate-500">Based on {{ bloomStore.allIssues.length }} actionable issues.</p>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex justify-between items-center border-b border-slate-100 pb-2">
            <span class="text-sm font-medium text-slate-600">Total Interactions</span>
            <span class="text-lg font-bold text-slate-900">{{ totalExpressions }}</span>
          </div>
          <div class="flex justify-between items-center border-b border-slate-100 pb-2">
            <span class="text-sm font-medium text-slate-600">Total Issues</span>
            <span class="text-lg font-bold text-slate-900">{{ bloomStore.allIssues.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-slate-600">Themes Tracked</span>
            <span class="text-lg font-bold text-slate-900">{{ bloomStore.themes.length }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
        <h3 class="text-lg font-medium text-slate-900 mb-6">Sentiment Distribution</h3>
        <div class="h-[350px] w-full">
          <v-chart class="chart" :option="chartOption" autoresize />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts modules
use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const ui = useUiStore()
const bloomStore = useBloomStore()

// Total expressions calculation for percentages
const totalExpressions = computed(() => {
  if (!bloomStore.joyStats) return 0;
  const m = bloomStore.joyStats.metrics;
  return m.joy + m.confidence + m.engagement + m.frustration + m.hopelessness;
})

function getPercentage(metric) {
  if (totalExpressions.value === 0) return 0;
  return (bloomStore.joyStats.metrics[metric] / totalExpressions.value) * 100;
}

// Helper to colorize the Joy text
function getJoyColor(score) {
  if (score < -0.5) return 'text-rose-500'
  if (score > 0.5) return 'text-bloom-accent2'
  return 'text-slate-500'
}

// ECharts Configuration Options
const chartOption = computed(() => {
  if (!bloomStore.joyStats) return {};
  const m = bloomStore.joyStats.metrics;
  
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { 
      type: 'category', 
      data: ['Sentiment Metrics'],
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      { name: 'Joy', type: 'bar', stack: 'total', itemStyle: { color: '#339A77' }, data: [m.joy] },
      { name: 'Confidence', type: 'bar', stack: 'total', itemStyle: { color: '#8A9A33' }, data: [m.confidence] },
      { name: 'Engagement', type: 'bar', stack: 'total', itemStyle: { color: '#cbd5e1' }, data: [m.engagement] },
      { name: 'Frustration', type: 'bar', stack: 'total', itemStyle: { color: '#fb7185' }, data: [m.frustration] },
      { name: 'Hopelessness', type: 'bar', stack: 'total', itemStyle: { color: '#e11d48' }, data: [m.hopelessness] }
    ]
  };
})

onMounted(async () => {
  // 1. Configure Layout: Close the right sidebar for the Dashboard
  ui.configureRightSidebar([], '', false) 
  
  // 2. Fetch the Data!
  // We pass the payload required by your backend
  await bloomStore.loadDashboardData({
    offeringXid: 'r.hilton.hhonors',
    bloomKey: '2026q1'
  })
})
</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
