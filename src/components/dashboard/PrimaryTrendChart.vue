<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      
      <div class="flex flex-col">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Trend Analysis
        </h3>
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Trailing {{ ttmTrendData?.metadata?.trailingMonthsConfig || 12 }} Months
        </span>
        
        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            {{ activeMetric === 'joy' ? currentJoyAverage : (activeMetric === 'volume' ? currentVolumeTotal : currentIssuesTotal) }}
          </span>
          
          <div v-if="currentDelta !== null" :class="[
            'flex items-center text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
            currentDelta > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
            currentDelta < 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 
            'text-slate-500 bg-slate-100 border-slate-200'
          ]">
            <svg v-if="currentDelta > 0" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            <svg v-else-if="currentDelta < 0" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            {{ Math.abs(currentDelta) }}% vs prior TTM
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-4">
        <div class="flex p-1 bg-slate-100 rounded-lg">
          <button 
            v-for="metric in [{ id: 'joy', label: 'Joy Score' }, { id: 'volume', label: 'Volume' }, { id: 'issues', label: 'Packets' }]"
            :key="metric.id"
            @click="activeMetric = metric.id"
            :class="['px-3 py-1 text-xs font-bold rounded-md transition-all', activeMetric === metric.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            {{ metric.label }}
          </button>
        </div>

        <div class="flex p-1 bg-slate-100 rounded-lg hidden sm:flex">
          <button 
            v-for="tf in ['days', 'weeks', 'months']" 
            :key="tf"
            @click="activeTimeframe = tf"
            :class="['px-3 py-1 text-xs font-bold rounded-md transition-all capitalize', activeTimeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            {{ tf }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-[300px] w-full relative">
      <v-chart class="absolute inset-0 w-full h-full" :option="chartOption" autoresize />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent, LegendComponent])

const bloomStore = useBloomStore()

// System Constants matching Backend
const JOY_FACTOR = 3;
const CONFIDENCE_FACTOR = 2;
const ENGAGEMENT_FACTOR = 1;
const FRUSTRATION_FACTOR = -1;
const HOPELESSNESS_FACTOR = -3;

const activeMetric = ref('joy') 
const activeTimeframe = ref('weeks') 

const ttmTrendData = computed(() => bloomStore.ttmTrendData)

// --- TOPLINE METRICS (Now natively powered by TTM backend totals!) ---
const currentJoyAverage = computed(() => {
  const score = ttmTrendData.value?.totals?.joyScore || 0;
  return score.toFixed(2);
})

const currentVolumeTotal = computed(() => {
  const count = ttmTrendData.value?.totals?.volume || 0;
  return new Intl.NumberFormat('en-US').format(count);
})

const currentIssuesTotal = computed(() => {
  const count = ttmTrendData.value?.totals?.issues || 0;
  return new Intl.NumberFormat('en-US').format(count);
})

// Dynamic Delta from Backend
const currentDelta = computed(() => {
  if (!ttmTrendData.value?.deltas) return null;
  if (activeMetric.value === 'joy') return ttmTrendData.value.deltas.joyScore;
  if (activeMetric.value === 'volume') return ttmTrendData.value.deltas.volume;
  if (activeMetric.value === 'issues') return ttmTrendData.value.deltas.issues;
  return null;
})

// --- DATA ENGINE: Fast Rollup ---
const chartData = computed(() => {
  const dailyBuckets = ttmTrendData.value?.dailyBuckets || []
  const buckets = {}

  // Helper to align dates into visual buckets
  const getBucketKey = (dateStr) => {
    // Treat the date string as UTC to prevent timezone shifting
    const d = new Date(dateStr + 'T00:00:00Z') 
    if (activeTimeframe.value === 'days') return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
    if (activeTimeframe.value === 'weeks') {
      const day = d.getUTCDay() || 7
      d.setUTCHours(-24 * (day - 1)) // Roll back to Monday
      return 'Week of ' + d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
    }
    return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', year: 'numeric' })
  }

  // 1. Roll up the daily buckets into the selected timeframe
  dailyBuckets.forEach(day => {
    const key = getBucketKey(day.date)

    if (!buckets[key]) {
      buckets[key] = { 
        volume: 0, 
        actionableSet: new Set(), // Use Sets to deduplicate
        generalSet: new Set(),    // Use Sets to deduplicate
        metrics: { joy: 0, confidence: 0, engagement: 0, frustration: 0, hopelessness: 0 }, 
        totalExpressions: 0, 
        timestamp: new Date(day.date + 'T00:00:00Z').getTime() 
      }
    }

    const b = buckets[key]
    b.volume += day.volume
    b.totalExpressions += day.totalExpressions
    
    // Add IDs to the Set (duplicates across days are automatically ignored)
    if (day.actionableIds) day.actionableIds.forEach(id => b.actionableSet.add(id))
    if (day.generalIds) day.generalIds.forEach(id => b.generalSet.add(id))

    if (day.metrics) {
      b.metrics.joy += day.metrics.joy || 0
      b.metrics.confidence += day.metrics.confidence || 0
      b.metrics.engagement += day.metrics.engagement || 0
      b.metrics.frustration += day.metrics.frustration || 0
      b.metrics.hopelessness += day.metrics.hopelessness || 0
    }
  })

  const sortedKeys = Object.keys(buckets).sort((a, b) => buckets[a].timestamp - buckets[b].timestamp)

  const xAxis = []
  const volumeSeries = []
  const actionableSeries = []
  const generalSeries = []
  const joySeries = []

  const totalVolume = sortedKeys.reduce((sum, key) => sum + buckets[key].volume, 0)
  const avgVolume = sortedKeys.length ? Math.round(totalVolume / sortedKeys.length) : 0

  // 2. Extract ECharts Arrays
  sortedKeys.forEach(key => {
    const b = buckets[key]
    xAxis.push(key)
    volumeSeries.push(b.volume)

    // Extract the mathematically correct size of the Set
    actionableSeries.push({ value: b.actionableSet.size, volume: b.volume })
    generalSeries.push({ value: b.generalSet.size, volume: b.volume })

    if (b.totalExpressions === 0) {
      joySeries.push({ value: 0, volume: b.volume, metrics: null, total: 0, avgVolume })
    } else {
      const score = 
        ((b.metrics.joy / b.totalExpressions) * JOY_FACTOR) +
        ((b.metrics.confidence / b.totalExpressions) * CONFIDENCE_FACTOR) +
        ((b.metrics.engagement / b.totalExpressions) * ENGAGEMENT_FACTOR) +
        ((b.metrics.frustration / b.totalExpressions) * FRUSTRATION_FACTOR) +
        ((b.metrics.hopelessness / b.totalExpressions) * HOPELESSNESS_FACTOR)
      
      joySeries.push({
        value: parseFloat(score.toFixed(2)),
        volume: b.volume,
        metrics: b.metrics,
        total: b.totalExpressions,
        avgVolume: avgVolume
      })
    }
  })

  return { xAxis, volumeSeries, actionableSeries, generalSeries, joySeries }
})

// --- ECHARTS CONFIGURATION ---
const chartOption = computed(() => {
  const isJoy = activeMetric.value === 'joy'
  const isVolume = activeMetric.value === 'volume'
  const isIssues = activeMetric.value === 'issues'
  const data = chartData.value

  let seriesArray = []

  if (isJoy) {
    seriesArray = [{
      name: 'Joy Score',
      data: data.joySeries,
      type: 'line',
      smooth: 0.3,
      symbolSize: 6, 
      itemStyle: { color: (params) => params.value < 0 ? '#ef4444' : '#10b981' },
      lineStyle: { width: 3, color: '#334155' },
      markLine: {
        data: [{ yAxis: 0 }],
        lineStyle: { color: '#94a3b8', type: 'solid', width: 1 },
        symbol: 'none',
        label: { show: false }
      }
    }]
  } else if (isVolume) {
    seriesArray = [{
      name: 'Volume',
      data: data.volumeSeries,
      type: 'bar',
      barMaxWidth: 40, 
      itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] }
    }]
  } else if (isIssues) {
    seriesArray = [
      {
        name: 'Backlog Candidates',
        data: data.actionableSeries,
        type: 'bar',
        stack: 'total-issues',
        barMaxWidth: 40,
        itemStyle: { color: '#6366f1' } 
      },
      {
        name: 'General Clusters',
        data: data.generalSeries,
        type: 'bar',
        stack: 'total-issues',
        barMaxWidth: 40,
        itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] } 
      }
    ]
  }

  return {
    grid: { top: isIssues ? 35 : 10, right: 10, bottom: 24, left: 45, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { show: isIssues, top: 0, right: 10, icon: 'circle', textStyle: { fontSize: 11, color: '#64748b' } },
    tooltip: {
      trigger: 'axis',
      position: function (point, params, dom, rect, size) {
        let x = point[0] + 15; let y = point[1] + 15;
        if (x + size.contentSize[0] > size.viewSize[0]) x = point[0] - size.contentSize[0] - 15;
        if (x < 10) x = 10;
        return [x, y];
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      padding: 0, 
      extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden; pointer-events: none;',
      formatter: (params) => {
        const p = params[0]
        let html = `<div class="flex flex-col min-w-[240px]"><div class="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">${p.name}</div><div class="p-4 flex flex-col gap-3">`

        if (isJoy) {
          const pointData = p.data
          const color = pointData.value < 0 ? '#ef4444' : '#10b981'
          const sign = pointData.value > 0 ? '+' : ''
          const volDiff = pointData.volume - pointData.avgVolume
          const volPct = pointData.avgVolume > 0 ? Math.round((volDiff / pointData.avgVolume) * 100) : 0
          
          let volColor = 'text-slate-400'
          let volSign = ''
          if (volPct > 0) { volColor = 'text-emerald-500'; volSign = '+' }
          else if (volPct < 0) { volColor = 'text-rose-500' }
          
          const volContextText = volPct !== 0 
            ? `<span class="${volColor} font-bold ml-1">(${volSign}${volPct}% vs avg)</span>` 
            : `<span class="text-slate-400 ml-1">(Average)</span>`
          
          html += `
            <div class="flex items-end justify-between">
              <span class="text-sm font-semibold text-slate-700">Joy Score</span>
              <span class="text-xl font-black leading-none" style="color: ${color}">${sign}${pointData.value}</span>
            </div>
            <div class="text-[11px] font-medium text-slate-500 mt-1">
              Volume: <b class="text-slate-700">${new Intl.NumberFormat('en-US').format(pointData.volume)}</b> ${volContextText}
            </div>`

          if (pointData.total > 0) {
            const getPct = (val) => Math.round((val / pointData.total) * 100)
            html += `
              <div class="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 mt-1 border-t border-slate-100 text-[11px]">
                <div class="flex justify-between"><span class="text-slate-500">✨ Joyful</span> <span class="font-bold text-slate-700">${getPct(pointData.metrics.joy)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-500">😎 Confident</span> <span class="font-bold text-slate-700">${getPct(pointData.metrics.confidence)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-500">👀 Engaged</span> <span class="font-bold text-slate-700">${getPct(pointData.metrics.engagement)}%</span></div>
                <div class="flex justify-between"><span class="text-slate-500">😤 Frustrat.</span> <span class="font-bold text-slate-700">${getPct(pointData.metrics.frustration)}%</span></div>
                <div/>
                <div class="flex justify-between col-span-2"><span class="text-slate-500">😔 Hopeless</span> <span class="font-bold text-slate-700">${getPct(pointData.metrics.hopelessness)}%</span></div>
              </div>`
          }
        } else if (isVolume) {
          const pointData = p.data
          html += `
            <div class="flex items-end justify-between">
              <span class="text-sm font-semibold text-slate-700">Total Volume</span>
              <span class="text-xl font-black leading-none text-slate-900">${new Intl.NumberFormat('en-US').format(pointData)}</span>
            </div>`
        } else if (isIssues) {
          const actionableData = params.find(p => p.seriesName === 'Backlog Candidates')?.data
          const generalData = params.find(p => p.seriesName === 'General Clusters')?.data
          
          const actionableVal = actionableData?.value || 0
          const generalVal = generalData?.value || 0
          const totalVal = actionableVal + generalVal

          html += `
            <div class="flex items-end justify-between mb-1">
              <span class="text-sm font-semibold text-slate-700">Total System Issues</span>
              <span class="text-xl font-black leading-none text-slate-900">${new Intl.NumberFormat('en-US').format(totalVal)}</span>
            </div>
            <div class="flex flex-col gap-1 text-[11px] font-medium text-slate-500 border-b border-slate-100 pb-2 mb-2">
              <div class="flex justify-between"><span class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-indigo-500"></div>Backlog Candidates</span> <span class="text-slate-900 font-bold">${actionableVal}</span></div>
              <div class="flex justify-between"><span class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-slate-300"></div>General Clusters</span> <span class="text-slate-900 font-bold">${generalVal}</span></div>
            </div>`
            // Note: topDrivers logic removed since backend grouping prevents granular issue mapping locally
        }

        html += `</div></div>`
        return html
      }
    },
    xAxis: {
      type: 'category',
      data: data.xAxis,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', margin: 12, fontFamily: 'inherit', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: isJoy ? -3 : 0, 
      max: isJoy ? 3 : 'dataMax',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { 
        color: '#94a3b8', 
        fontSize: 11,
        formatter: (value) => isJoy ? value.toFixed(1) : new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)
      }
    },
    series: seriesArray
  }
})
</script>