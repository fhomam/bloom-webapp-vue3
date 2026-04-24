<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      
      <div class="flex flex-col">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Trend Analysis
        </h3>
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trailing 12 Months</span>
        
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

const activeMetric = ref('joy') 
const activeTimeframe = ref('weeks') 

// --- TOPLINE METRICS ---
const currentJoyAverage = computed(() => {
  const score = bloomStore.joyStats?.score;
  return typeof score === 'number' ? score.toFixed(2) : "0.00"
})

const currentVolumeTotal = computed(() => {
  const count = bloomStore.joyStats?.metrics?.reviewsAnalyzed || 0
  return new Intl.NumberFormat('en-US').format(count)
})

const currentIssuesTotal = computed(() => {
  return new Intl.NumberFormat('en-US').format(bloomStore.allIssues?.length || 0)
})

// 🔥 FIX: Delta Scaffolding
// This watches the active tab and provides the correct delta for the selected metric.
// If the data is null, the pill gracefully hides itself.
const currentDelta = computed(() => {
  // TODO: Replace with real Prior TTM math when the backend endpoint is wired up
  if (activeMetric.value === 'joy') return 5;     // Mock: +5%
  if (activeMetric.value === 'volume') return -12; // Mock: -12%
  if (activeMetric.value === 'issues') return null; // Mock: Hide Pill (No prior data)
  return null;
})

const JOY_FACTORS = { joy: 3, confidence: 2, engagement: 1, frustration: -1.5, hopelessness: -3 }

// --- DATA ENGINE: Stacked Bucketing ---
const chartData = computed(() => {
  const issues = bloomStore.allIssues || []
  const buckets = {}

  const getBucketKey = (dateObj) => {
    if (activeTimeframe.value === 'days') return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (activeTimeframe.value === 'weeks') {
      const day = dateObj.getDay() || 7
      dateObj.setHours(-24 * (day - 1))
      return 'Week of ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const initBucket = (key, timestamp) => {
    buckets[key] = { 
      volume: 0, 
      actionableMap: {}, // For Backlog Candidates
      generalMap: {},    // For Contextual/General items
      joyMetrics: { joy: 0, confidence: 0, engagement: 0, frustration: 0, hopelessness: 0 }, 
      timestamp 
    }
  }

  // 1. Group interactions and split issues into correct map
  issues.forEach(issue => {
    if (!issue.interactions) return

    const isActionable = issue.class === 'backlog-candidate' || (!issue.class && !issue.taxo?.includes('non_issue'))

    issue.interactions.forEach(interaction => {
      const dateStr = interaction.updatedAtSource || interaction.createdAt
      if (!dateStr) return
      
      const dateObj = new Date(dateStr)
      const intKey = getBucketKey(new Date(dateObj.getTime()))

      if (!buckets[intKey]) initBucket(intKey, dateObj.getTime())

      const b = buckets[intKey]
      b.volume += 1

      // Track issue participation in the correct stack
      if (isActionable) {
        if (!b.actionableMap[issue.id]) b.actionableMap[issue.id] = { title: issue.title || issue.taxo, count: 0 }
        b.actionableMap[issue.id].count += 1
      } else {
        if (!b.generalMap[issue.id]) b.generalMap[issue.id] = { title: issue.title || issue.taxo, count: 0 }
        b.generalMap[issue.id].count += 1
      }

      if (interaction.analysis && interaction.analysis.joy) {
        interaction.analysis.joy.forEach(j => {
          if (b.joyMetrics[j.metric] !== undefined) b.joyMetrics[j.metric] += 1
        })
      }
    })
  })

  // 2. Sort chronologically
  const sortedKeys = Object.keys(buckets).sort((a, b) => buckets[a].timestamp - buckets[b].timestamp)

  const xAxis = []
  const volumeSeries = []
  const actionableSeries = []
  const generalSeries = []
  const joySeries = []

  const totalVolume = sortedKeys.reduce((sum, key) => sum + buckets[key].volume, 0)
  const avgVolume = sortedKeys.length ? Math.round(totalVolume / sortedKeys.length) : 0

  // 3. Extract ECharts Arrays
  sortedKeys.forEach(key => {
    const b = buckets[key]
    xAxis.push(key)
    volumeSeries.push(b.volume)

    // Parse the two stacks
    const activeActionable = Object.values(b.actionableMap)
    const activeGeneral = Object.values(b.generalMap)
    
    actionableSeries.push({ 
      value: activeActionable.length, 
      volume: b.volume,
      topDrivers: activeActionable.sort((a, b) => b.count - a.count).slice(0, 3)
    })
    
    generalSeries.push({ 
      value: activeGeneral.length,
      volume: b.volume
    })

    const totalExpressions = Object.values(b.joyMetrics).reduce((sum, val) => sum + val, 0)
    if (totalExpressions === 0) {
      joySeries.push({ value: 0, volume: b.volume, metrics: null, total: 0, avgVolume })
    } else {
      const score = 
        ((b.joyMetrics.joy / totalExpressions) * JOY_FACTORS.joy) +
        ((b.joyMetrics.confidence / totalExpressions) * JOY_FACTORS.confidence) +
        ((b.joyMetrics.engagement / totalExpressions) * JOY_FACTORS.engagement) +
        ((b.joyMetrics.frustration / totalExpressions) * JOY_FACTORS.frustration) +
        ((b.joyMetrics.hopelessness / totalExpressions) * JOY_FACTORS.hopelessness)
      
      joySeries.push({
        value: parseFloat(score.toFixed(2)),
        volume: b.volume,
        metrics: b.joyMetrics,
        total: totalExpressions,
        avgVolume: avgVolume
      })
    }
  })

  return { xAxis, volumeSeries, actionableSeries, generalSeries, joySeries }
})

// --- REACTIVE ECHARTS CONFIGURATION ---
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
    // STACKED BAR CONFIGURATION
    seriesArray = [
      {
        name: 'Backlog Candidates',
        data: data.actionableSeries,
        type: 'bar',
        stack: 'total-issues', // Explicitly grouping them together
        barMaxWidth: 40,
        itemStyle: { color: '#6366f1' } // Indigo base
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
    grid: { 
      top: isIssues ? 35 : 10, 
      right: 10, 
      bottom: 24, 
      left: 45, 
      outerBoundsMode: 'same', 
      outerBoundsContain: 'axisLabel' 
    },
    legend: {
      show: isIssues, 
      top: 0,
      right: 10,
      icon: 'circle',
      textStyle: { fontSize: 11, color: '#64748b' }
    },
    tooltip: {
      trigger: 'axis',
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
          // params contains an array of the two stacked bar objects
          const actionableData = params.find(p => p.seriesName === 'Backlog Candidates')?.data
          const generalData = params.find(p => p.seriesName === 'General Clusters')?.data
          
          const actionableVal = actionableData?.value || 0
          const generalVal = generalData?.value || 0
          const totalVal = actionableVal + generalVal

          // Fallback to the volume recorded in the actionable object (both have the same total volume)
          const bucketVolume = actionableData?.volume || generalData?.volume || 0

          html += `
            <div class="flex items-end justify-between mb-1">
              <span class="text-sm font-semibold text-slate-700">Total System Issues</span>
              <span class="text-xl font-black leading-none text-slate-900">${new Intl.NumberFormat('en-US').format(totalVal)}</span>
            </div>
            <div class="flex flex-col gap-1 text-[11px] font-medium text-slate-500 border-b border-slate-100 pb-2 mb-2">
              <div class="flex justify-between"><span class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-indigo-500"></div>Backlog Candidates</span> <span class="text-slate-900 font-bold">${actionableVal}</span></div>
              <div class="flex justify-between"><span class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-slate-300"></div>General Clusters</span> <span class="text-slate-900 font-bold">${generalVal}</span></div>
            </div>`

          if (actionableData && actionableData.topDrivers && actionableData.topDrivers.length > 0) {
            html += `<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-1">Actionable Drivers</div>`
            actionableData.topDrivers.forEach(td => {
               html += `
                 <div class="flex items-center justify-between gap-3 mb-1.5">
                   <span class="text-[11px] text-slate-600 truncate max-w-[160px] font-medium" title="${td.title}">${td.title}</span>
                   <span class="text-[10px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">${td.count}</span>
                 </div>
               `
            })
          }
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