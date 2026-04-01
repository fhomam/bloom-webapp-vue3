<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      
      <div class="flex flex-col">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
          Trend Analysis
        </h3>
        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            {{ activeMetric === 'joy' ? currentJoyAverage : currentVolumeTotal }}
          </span>
          <div class="flex items-center text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            5% vs last period
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-4">
        
        <div class="flex p-1 bg-slate-100 rounded-lg">
          <button 
            @click="activeMetric = 'joy'"
            :class="['px-3 py-1 text-xs font-bold rounded-md transition-all', activeMetric === 'joy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Joy Score
          </button>
          <button 
            @click="activeMetric = 'volume'"
            :class="['px-3 py-1 text-xs font-bold rounded-md transition-all', activeMetric === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Volume
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
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent])

const bloomStore = useBloomStore()

// --- STATE ---
const activeMetric = ref('joy') // 'joy' or 'volume'
const activeTimeframe = ref('weeks') // 'days', 'weeks', 'months'

// --- TOPLINE METRICS (Reads from Pinia) ---
const currentJoyAverage = computed(() => {
  const score = bloomStore.joyStats?.score;
  return typeof score === 'number' ? score.toFixed(2) : "0.00"
})

const currentVolumeTotal = computed(() => {
  const count = bloomStore.joyStats?.metrics?.reviewsAnalyzed || 0
  return new Intl.NumberFormat('en-US').format(count)
})

// --- MATH CONSTANTS ---
const JOY_FACTORS = {
  joy: 3,
  confidence: 2,
  engagement: 1,
  frustration: -1.5,
  hopelessness: -3
}

// --- DATA ENGINE: Time-Series Bucketing ---
const chartData = computed(() => {
  const issues = bloomStore.allIssues || []
  const buckets = {}

  // 1. Group interactions
  issues.forEach(issue => {
    if (!issue.interactions) return
    
    issue.interactions.forEach(interaction => {
      const dateStr = interaction.updatedAtSource || interaction.createdAt
      if (!dateStr) return
      
      const dateObj = new Date(dateStr)
      let bucketKey = ''

      if (activeTimeframe.value === 'days') {
        bucketKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (activeTimeframe.value === 'weeks') {
        const day = dateObj.getDay() || 7
        dateObj.setHours(-24 * (day - 1))
        bucketKey = 'Week of ' + dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        bucketKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { volume: 0, joyMetrics: { joy: 0, confidence: 0, engagement: 0, frustration: 0, hopelessness: 0 }, timestamp: dateObj.getTime() }
      }

      buckets[bucketKey].volume += 1

      if (interaction.analysis && interaction.analysis.joy) {
        interaction.analysis.joy.forEach(j => {
          if (buckets[bucketKey].joyMetrics[j.metric] !== undefined) {
            buckets[bucketKey].joyMetrics[j.metric] += 1
          }
        })
      }
    })
  })

  // 2. Sort chronologically
  const sortedKeys = Object.keys(buckets).sort((a, b) => buckets[a].timestamp - buckets[b].timestamp)

  const xAxis = []
  const volumeSeries = []
  const joySeries = []

  // Pre-calculate average volume for tooltip context
  const totalVolume = sortedKeys.reduce((sum, key) => sum + buckets[key].volume, 0)
  const avgVolume = sortedKeys.length ? Math.round(totalVolume / sortedKeys.length) : 0

  // 3. Extract ECharts Arrays
  sortedKeys.forEach(key => {
    const b = buckets[key]
    xAxis.push(key)
    volumeSeries.push(b.volume)

    const totalExpressions = Object.values(b.joyMetrics).reduce((sum, val) => sum + val, 0)
    
    if (totalExpressions === 0) {
      joySeries.push({ value: 0, volume: 0, metrics: null, total: 0, avgVolume })
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

  return { xAxis, volumeSeries, joySeries }
})

// --- REACTIVE ECHARTS CONFIGURATION ---
const chartOption = computed(() => {
  const isJoy = activeMetric.value === 'joy'
  const data = chartData.value

  return {
    grid: { top: 10, right: 10, bottom: 24, left: 45, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: '#e2e8f0',
      padding: 0, 
      extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-radius: 12px; overflow: hidden;',
      formatter: (params) => {
        const p = params[0]
        const pointData = p.data
        let html = `<div class="flex flex-col min-w-[240px]">`
        
        html += `<div class="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">${p.name}</div>`
        html += `<div class="p-4 flex flex-col gap-3">`

        if (isJoy) {
          const color = pointData.value < 0 ? '#ef4444' : '#10b981'
          const sign = pointData.value > 0 ? '+' : ''
          
          // Calculate Volume Delta vs Average
          const volDiff = pointData.volume - pointData.avgVolume
          const volPct = pointData.avgVolume > 0 ? Math.round((volDiff / pointData.avgVolume) * 100) : 0
          
          // Formatting the context string
          let volColor = 'text-slate-400'
          let volSign = ''
          if (volPct > 0) { volColor = 'text-emerald-500'; volSign = '+' }
          else if (volPct < 0) { volColor = 'text-rose-500' }
          
          const volContextText = volPct !== 0 
            ? `<span class="${volColor} font-bold ml-1">(${volSign}${volPct}% vs avg)</span>` 
            : `<span class="text-slate-400 ml-1">(Average)</span>`
          
          // Primary Metric & Volume Context
          html += `
            <div class="flex items-end justify-between">
              <span class="text-sm font-semibold text-slate-700">Joy Score</span>
              <span class="text-xl font-black leading-none" style="color: ${color}">${sign}${pointData.value}</span>
            </div>
            <div class="text-[11px] font-medium text-slate-500 mt-1">
              Volume: <b class="text-slate-700">${new Intl.NumberFormat('en-US').format(pointData.volume)}</b> ${volContextText}
            </div>
          `

          // Emotional Breakdown Grid
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
              </div>
            `
          }
        } else {
          // Volume Mode Tooltip
          html += `
            <div class="flex items-end justify-between">
              <span class="text-sm font-semibold text-slate-700">Total Volume</span>
              <span class="text-xl font-black leading-none text-slate-900">${new Intl.NumberFormat('en-US').format(pointData)}</span>
            </div>
          `
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
        fontFamily: 'inherit',
        fontSize: 11,
        formatter: (value) => isJoy ? value.toFixed(1) : new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)
      }
    },
    series: [
      {
        name: isJoy ? 'Joy Score' : 'Volume',
        data: isJoy ? data.joySeries : data.volumeSeries,
        type: isJoy ? 'line' : 'bar',
        smooth: isJoy ? 0.3 : false,
        symbolSize: isJoy ? 6 : 0, 
        barMaxWidth: 40, 
        itemStyle: {
          color: isJoy 
            ? (params) => params.value < 0 ? '#ef4444' : '#10b981' 
            : '#cbd5e1', 
          borderRadius: isJoy ? 0 : [4, 4, 0, 0] 
        },
        lineStyle: { width: 3, color: '#334155' },
        markLine: isJoy ? {
          data: [{ yAxis: 0 }],
          lineStyle: { color: '#94a3b8', type: 'solid', width: 1 },
          symbol: 'none',
          label: { show: false }
        } : null
      }
    ]
  }
})
</script>
