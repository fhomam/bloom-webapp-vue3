<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Emotional Momentum
      </h3>
      <span class="text-xs font-medium text-slate-400">30-Day Trend</span>
    </div>

    <div class="flex flex-col gap-1">
      <div 
        v-for="(dim, key) in dimensions" 
        :key="key"
        class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group"
      >
        <div class="flex items-center gap-3 w-1/3 min-w-[120px]">
          <span class="text-2xl leading-none">{{ dim.emoji }}</span>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-900">{{ dim.label }}</span>
            <span class="text-xs text-slate-500">{{ dim.value }}% of total</span>
          </div>
        </div>

        <div class="flex-1 h-10 w-full relative ml-4">
          <v-chart class="absolute inset-0 w-full h-full" :option="getSparklineOption(dim.history, dim.color)" autoresize />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register extremely minimal ECharts modules
use([CanvasRenderer, LineChart, GridComponent])

const dimensions = reactive({
  joy:          { label: 'Joyful', emoji: '✨', value: 20, color: '#10b981', history: [10, 12, 15, 14, 18, 20] },
  confidence:   { label: 'Confident', emoji: '😎', value: 15, color: '#60a5fa', history: [15, 15, 16, 15, 14, 15] },
  engagement:   { label: 'Engaged', emoji: '👀', value: 20, color: '#cbd5e1', history: [22, 21, 20, 20, 20, 20] },
  frustration:  { label: 'Frustrated', emoji: '😤', value: 30, color: '#fb923c', history: [20, 25, 28, 25, 29, 30] },
  hopelessness: { label: 'Hopeless', emoji: '😔', value: 15, color: '#f43f5e', history: [20, 18, 15, 12, 14, 15] }
})

// Function to generate ultra-minimal sparkline config
const getSparklineOption = (dataArray, color) => {
  return {
    // 0 padding, no axes, no tooltips. Pure data art.
    grid: { top: 2, right: 0, bottom: 2, left: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [
      {
        data: dataArray,
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: color },
        // Optional: Add a subtle area fill below the line
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: color }, { offset: 1, color: 'rgba(255,255,255,0)' }]
          },
          opacity: 0.2
        }
      }
    ]
  }
}
</script>