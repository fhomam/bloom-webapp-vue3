<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Emotional Momentum
      </h3>
      <span class="text-xs font-medium text-slate-400">Daily 28-Day Trend</span>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 min-h-[400px]">
      
      <div class="flex flex-col gap-3 lg:w-3/5 xl:w-2/3">
        <div 
          v-for="dim in processedDimensions" 
          :key="dim.id"
          @click="selectedDimensionId = dim.id"
          :class="[
            'flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer group',
            selectedDimensionId === dim.id 
              ? 'border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200' 
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          ]"
        >
          <div class="flex items-center gap-3 w-1/3 min-w-[130px]">
            <span class="text-3xl leading-none transition-transform group-hover:scale-110">{{ dim.emoji }}</span>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-900">{{ dim.label }}</span>
              <span class="text-xs font-medium text-slate-500">{{ dim.value }}% of volume</span>
            </div>
          </div>

          <div class="flex-1 h-14 w-full relative ml-4 bg-white/50 border border-slate-100 rounded-md p-1 overflow-hidden">
            <v-chart class="absolute inset-0 w-full h-full" :option="getSparklineOption(dim)" autoresize />
          </div>
        </div>
      </div>

      <div class="lg:w-2/5 xl:w-1/3 flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-5 overflow-hidden max-h-[500px] lg:max-h-[460px]">
        
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 shrink-0">
          <div class="flex items-center gap-2">
            <span v-if="selectedDimension" class="text-xl">{{ selectedDimension.emoji }}</span>
            <span v-else class="text-xl">⏱️</span>
            
            <h4 class="text-sm font-bold text-slate-900">
              {{ selectedDimension ? `Recent ${selectedDimension.label}` : 'Latest Highlights' }}
            </h4>
          </div>
          <button v-if="selectedDimensionId" @click.stop="selectedDimensionId = null" class="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider bg-white border border-slate-200 px-2 py-1 rounded">
            View All
          </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 hide-scrollbar min-h-0">
          <div 
            v-for="(interaction, index) in verbatimFeed" 
            :key="interaction.id || index"
            class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {{ formatDate(interaction.createdAt) }}
              </span>
              <span v-if="!selectedDimensionId" class="text-[13px]" :title="interaction._primaryEmotion">
                {{ getEmojiForMetric(interaction._primaryEmotion) }}
              </span>
              <span v-else class="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                {{ interaction.country || 'US' }}
              </span>
            </div>
            
            <p 
              class="text-sm text-slate-700 leading-relaxed"
              v-html="smartHighlight(interaction.content.raw, interaction.analysis.joy, selectedDimensionId || interaction._primaryEmotion)"
            ></p>
          </div>

          <div v-if="verbatimFeed.length === 0" class="text-center text-sm text-slate-400 py-10">
            No verbatim data available.
          </div>
        </div>
        
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent])

const bloomStore = useBloomStore()

// State
const selectedDimensionId = ref(null)

// 1. Fixed Order Configuration
const dimOrder = ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']
const dimConfig = {
  joy:          { id: 'joy', label: 'Joyful', emoji: '✨', color: '#10b981', highlightClass: 'bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded' },
  confidence:   { id: 'confidence', label: 'Confident', emoji: '😎', color: '#3b82f6', highlightClass: 'bg-blue-100 text-blue-900 font-semibold px-0.5 rounded' },
  engagement:   { id: 'engagement', label: 'Engaged', emoji: '👀', color: '#94a3b8', highlightClass: 'bg-slate-200 text-slate-900 font-semibold px-0.5 rounded' },
  frustration:  { id: 'frustration', label: 'Frustrated', emoji: '😤', color: '#f97316', highlightClass: 'bg-orange-100 text-orange-900 font-semibold px-0.5 rounded' },
  hopelessness: { id: 'hopelessness', label: 'Hopeless', emoji: '😔', color: '#e11d48', highlightClass: 'bg-rose-100 text-rose-900 font-semibold px-0.5 rounded' }
}

const selectedDimension = computed(() => selectedDimensionId.value ? dimConfig[selectedDimensionId.value] : null)
const getEmojiForMetric = (metric) => dimConfig[metric]?.emoji || '😶'

// 2. Process Pinia Data into Daily 28-Day Series
const processedDimensions = computed(() => {
  const issues = bloomStore.allIssues || []
  const results = JSON.parse(JSON.stringify(dimConfig))
  
  Object.values(results).forEach(dim => {
    dim.history = new Array(28).fill(0)
    dim.totalCount = 0
  })

  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000
  let totalInteractionsProcessed = 0

  // Tally Daily Buckets
  issues.forEach(issue => {
    if (!issue.interactions) return
    issue.interactions.forEach(interaction => {
      if (!interaction.analysis?.joy) return

      const timestamp = new Date(interaction.updatedAtSource || interaction.createdAt).getTime()
      const daysAgo = Math.floor((now - timestamp) / dayInMs)

      if (daysAgo >= 0 && daysAgo < 28) {
        const bucketIndex = 27 - daysAgo 
        interaction.analysis.joy.forEach(j => {
          if (results[j.metric]) {
            results[j.metric].history[bucketIndex] += 1
            results[j.metric].totalCount += 1
            totalInteractionsProcessed += 1
          }
        })
      }
    })
  })

  // Enforce Strict Order & Calculate Percentages
  return dimOrder.map(metricId => {
    const dim = results[metricId]
    dim.value = totalInteractionsProcessed === 0 ? 0 : Math.round((dim.totalCount / totalInteractionsProcessed) * 100)
    
    // Fallback flatline if zero data
    if (dim.totalCount === 0) dim.history = new Array(28).fill(1)
    
    return dim
  })
})

// 3. Smart Highlight Engine (Expands to Word Boundaries)
const smartHighlight = (rawText, joyArray, targetMetric) => {
  if (!rawText) return ''
  const analysis = joyArray.find(j => j.metric === targetMetric)
  if (!analysis || !analysis.bits || analysis.bits.length === 0) return rawText

  const colorClass = dimConfig[targetMetric].highlightClass
  
  // Expand bits to full words
  let expandedBits = analysis.bits.map(([start, end]) => {
    let s = start
    let e = end
    // Expand left if the character before isn't whitespace/punctuation
    while (s > 0 && /\w/.test(rawText[s - 1])) s--
    // Expand right if the character after isn't whitespace/punctuation
    while (e < rawText.length - 1 && /\w/.test(rawText[e + 1])) e++
    return [s, e]
  })

  // Merge overlapping bit bounds so HTML tags don't break
  expandedBits.sort((a, b) => a[0] - b[0])
  let mergedBits = []
  expandedBits.forEach(bit => {
    if (!mergedBits.length) mergedBits.push([...bit])
    else {
      let last = mergedBits[mergedBits.length - 1]
      if (bit[0] <= last[1] + 1) last[1] = Math.max(last[1], bit[1])
      else mergedBits.push([...bit])
    }
  })

  // Splice string
  let result = ''
  let currentIndex = 0
  mergedBits.forEach(([start, end]) => {
    result += rawText.substring(currentIndex, start)
    result += `<mark class="${colorClass}">` + rawText.substring(start, end + 1) + `</mark>`
    currentIndex = end + 1
  })
  
  result += rawText.substring(currentIndex)
  return result
}

// 4. Feed Generator (Default to mixed latest, or filter by click)
const verbatimFeed = computed(() => {
  let examples = []
  const issues = bloomStore.allIssues || []

  for (const issue of issues) {
    if (!issue.interactions) continue
    for (const interaction of issue.interactions) {
      if (!interaction.analysis?.joy) continue
      
      // If a dimension is clicked, only grab that metric
      if (selectedDimensionId.value) {
        if (interaction.analysis.joy.some(j => j.metric === selectedDimensionId.value)) {
          examples.push(interaction)
        }
      } 
      // If default view, grab interaction and tag it with its highest priority emotion
      else {
        if (interaction.analysis.joy.length > 0) {
          // Sort by our dimOrder to pick the most 'severe' or relevant emotion to highlight
          const sortedEmotions = [...interaction.analysis.joy].sort((a, b) => {
             return dimOrder.indexOf(a.metric) - dimOrder.indexOf(b.metric)
          })
          examples.push({ ...interaction, _primaryEmotion: sortedEmotions[0].metric })
        }
      }
    }
  }

  // Sort by newest and grab top 5-6
  return examples
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
})

// 5. Daily ECharts Config
const getSparklineOption = (dim) => {
  return {
    grid: { top: 5, right: 10, bottom: 15, left: 10 },
    xAxis: { 
      type: 'category', 
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: '#e2e8f0' } }, 
      axisLabel: { showMinLabel: true, showMaxLabel: true, color: '#94a3b8', fontSize: 9, margin: 4, formatter: (value, index) => index === 0 ? '-28d' : (index === 27 ? 'Now' : '') },
      axisTick: { show: false }
    },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [
      {
        data: dim.history, // Daily buckets
        type: 'line',
        smooth: 0.25, // Less smooth, more spikey
        showSymbol: false,
        lineStyle: { width: 2, color: dim.color },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: dim.color }, { offset: 1, color: 'rgba(255,255,255,0)' }]
          },
          opacity: 0.15
        }
      }
    ]
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>