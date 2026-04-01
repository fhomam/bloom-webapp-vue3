<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
          Trend Analysis
        </h3>
        <div class="flex items-baseline gap-3">
          <span class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ activeMetric === 'joy' ? currentJoyAverage : currentVolumeTotal }}
          </span>
          <div class="flex items-center text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            5% vs last period
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-4">
        
        <div class="flex p-1 bg-slate-100 rounded-lg">
          <button 
            @click="activeMetric = 'joy'"
            :class="['px-3 py-1.5 text-xs font-semibold rounded-md transition-all', activeMetric === 'joy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Joy Score
          </button>
          <button 
            @click="activeMetric = 'volume'"
            :class="['px-3 py-1.5 text-xs font-semibold rounded-md transition-all', activeMetric === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            Volume
          </button>
        </div>

        <div class="flex p-1 bg-slate-100 rounded-lg hidden sm:flex">
          <button 
            v-for="tf in ['days', 'weeks', 'months']" 
            :key="tf"
            @click="activeTimeframe = tf"
            :class="['px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize', activeTimeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
          >
            {{ tf }}
          </button>
        </div>

        <button class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm">
          This Period
          <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

      </div>
    </div>

    <div class="flex-1 min-h-[300px] w-full relative">
      <v-chart class="absolute inset-0 w-full h-full" :option="chartOption" autoresize />
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register necessary ECharts modules
use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent])

// State
const activeMetric = ref('joy') // 'joy' or 'volume'
const activeTimeframe = ref('weeks') // 'days', 'weeks', 'months'

// Mock Data
const currentJoyAverage = "-0.79"
const currentVolumeTotal = "21,200"

const xAxisData = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
const joyData = [-0.2, -0.5, -0.8, -0.79, -0.6, -0.4]
const volumeData = [3200, 4100, 2900, 5000, 3800, 2200]

// Reactive ECharts Configuration
const chartOption = computed(() => {
  const isJoy = activeMetric.value === 'joy'

  return {
    // Premium minimalistic grid
    grid: {
      top: 10,
      right: 10,
      bottom: 24,
      left: 40,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0', // slate-200
      textStyle: { color: '#0f172a', fontSize: 13, fontFamily: 'inherit' },
      padding: [8, 12],
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;'
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: '#e2e8f0' } }, // Clean slate-200 line
      axisTick: { show: false }, // Remove harsh ticks
      axisLabel: { color: '#64748b', margin: 12, fontFamily: 'inherit', fontSize: 12 } // slate-500
    },
    yAxis: {
      type: 'value',
      // If Joy, lock axis from -3 to 3 (assuming that's your formula bounds). Otherwise dynamic.
      min: isJoy ? -3 : 0, 
      max: isJoy ? 3 : 'dataMax',
      splitLine: { 
        lineStyle: { color: '#f1f5f9', type: 'dashed' } // Very subtle slate-100 dashed grid
      },
      axisLabel: { 
        color: '#94a3b8', // slate-400
        fontFamily: 'inherit',
        formatter: (value) => isJoy ? value.toFixed(1) : new Intl.NumberFormat('en-US', { notation: "compact" }).format(value)
      }
    },
    series: [
      {
        name: isJoy ? 'Joy Score' : 'Volume',
        data: isJoy ? joyData : volumeData,
        // Smooth line for Joy, Pill-shaped bars for Volume
        type: isJoy ? 'line' : 'bar',
        smooth: isJoy,
        symbolSize: isJoy ? 8 : 0, // Show dots only on line chart
        barWidth: '30%', // Keep bars elegant, not chunky
        itemStyle: {
          // Dynamic coloring based on metric and value
          color: isJoy 
            ? (params) => params.value < 0 ? '#ef4444' : '#10b981' // red-500 if negative, emerald-500 if positive
            : '#cbd5e1', // slate-300 for volume bars
          borderRadius: isJoy ? 0 : [4, 4, 0, 0] // Rounded top corners for bars
        },
        lineStyle: {
          width: 3,
          color: '#334155' // Dark slate for the line itself
        },
        // Adds a visual 'Zero' line when viewing Joy Score
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
