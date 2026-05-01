<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-slate-800 tracking-tight">Emotional Trajectory</h3>
        <span class="text-xs font-medium text-slate-500 mt-0.5">Trailing 28-day window</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 min-h-[400px]">
      
      <div class="flex flex-col gap-3 lg:w-3/5 xl:w-2/3">
        <div 
          v-for="dim in processedDimensions" 
          :key="dim.id"
          @click="handleDimensionClick(dim.id)"
          :class="[
            'flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between p-3 border rounded-xl transition-all cursor-pointer group',
            selectedDimensionId === dim.id 
              ? 'border-slate-300 bg-slate-50 shadow-sm ring-1 ring-slate-200' 
              : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          ]"
        >
          <div class="flex items-center gap-3 w-full min-[480px]:w-1/3 min-w-0 min-[480px]:min-w-[130px] mb-2 min-[480px]:mb-0">
            <span class="text-3xl leading-none transition-transform group-hover:scale-110">{{ dim.emoji }}</span>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-slate-900">{{ dim.label }}</span>
              <span class="text-xs font-medium text-slate-500">{{ dim.value }}% of volume</span>
            </div>
          </div>

          <div class="w-full min-[480px]:flex-1 h-12 min-[480px]:h-14 relative ml-0 min-[480px]:ml-4 bg-white/50 border border-slate-100 rounded-md p-1 overflow-hidden shrink-0 mt-2 min-[480px]:mt-0">
            <v-chart class="absolute inset-0 w-full h-full" :option="getSparklineOption(dim)" autoresize />
          </div>
        </div>
      </div>

      <div 
        ref="feedContainerRef"
        class="lg:w-2/5 xl:w-1/3 flex flex-col bg-slate-50 border border-slate-100 rounded-xl p-5 overflow-hidden max-h-[500px] lg:max-h-[460px]"
      >
        
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 shrink-0">
          <div class="flex items-center gap-2">
            <span v-if="selectedDimension" class="text-xl">{{ selectedDimension.emoji }}</span>
            <span v-else class="text-xl">⏱️</span>
            
            <h4 class="text-sm font-bold text-slate-900">
              {{ selectedDimension ? `Recent ${selectedDimension.label} Expressions` : 'Latest Highlights' }}
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
                {{ formatDate(interaction.updatedAtSource || interaction.createdAt) }}
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

          <div v-if="verbatimFeed.length === 0" class="flex flex-col items-center justify-center text-center text-sm text-slate-400 py-12 px-4 bg-white/50 border border-slate-100 border-dashed rounded-xl mt-2">
            <span class="text-2xl mb-2 grayscale opacity-50">
              {{ selectedDimension ? selectedDimension.emoji : '📭' }}
            </span>
            <span class="font-medium text-slate-500">No recent interactions</span>
            <span class="text-xs mt-1">No interactions matched this emotion in the past 28 days.</span>
          </div>
        </div>
        
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent])

const bloomStore = useBloomStore()

const selectedDimensionId = ref(null)
const feedContainerRef = ref(null) // 2. Initialize the ref
const INTERACTION_LIST_LIMIT = 100 

const dimOrder = ['joy', 'confidence', 'engagement', 'frustration', 'hopelessness']
const dimConfig = {
  joy:          { id: 'joy', label: 'Joy', emoji: '✨', color: '#10b981', highlightClass: 'bg-emerald-100 text-emerald-900 font-semibold px-0.5 rounded' },
  confidence:   { id: 'confidence', label: 'Confidence', emoji: '😎', color: '#3b82f6', highlightClass: 'bg-blue-100 text-blue-900 font-semibold px-0.5 rounded' },
  engagement:   { id: 'engagement', label: 'Engagement', emoji: '👀', color: '#94a3b8', highlightClass: 'bg-slate-200 text-slate-900 font-semibold px-0.5 rounded' },
  frustration:  { id: 'frustration', label: 'Frustration', emoji: '😤', color: '#f97316', highlightClass: 'bg-orange-100 text-orange-900 font-semibold px-0.5 rounded' },
  hopelessness: { id: 'hopelessness', label: 'Hopelessness', emoji: '😔', color: '#e11d48', highlightClass: 'bg-rose-100 text-rose-900 font-semibold px-0.5 rounded' }
}

const selectedDimension = computed(() => selectedDimensionId.value ? dimConfig[selectedDimensionId.value] : null)
const getEmojiForMetric = (metric) => dimConfig[metric]?.emoji || '😶'

// Check if the mathematical end of the period is in the future
const isOngoingPeriod = computed(() => {
  if (!bloomStore.ttmTrendData?.metadata?.anchorDate) return false;
  return new Date(bloomStore.ttmTrendData.metadata.anchorDate).getTime() > Date.now();
});


// Clamp the anchor to 'now' so ongoing periods trail from today, 
// while past periods trail from their historical end date.
const anchorMs = computed(() => {
  let targetMs = Date.now();
  if (bloomStore.ttmTrendData?.metadata?.anchorDate) {
    targetMs = new Date(bloomStore.ttmTrendData.metadata.anchorDate).getTime();
  }
  return Math.min(targetMs, Date.now());
});

// TTM Piggybacking (No new endpoints!)
const processedDimensions = computed(() => {
  const results = JSON.parse(JSON.stringify(dimConfig))
  Object.values(results).forEach(dim => {
    dim.history = []
    dim.totalCount = 0
  })

  const trendData = bloomStore.ttmTrendData
  
  // Graceful fallback if TTM data hasn't loaded yet
  if (!trendData || !trendData.dailyBuckets) {
    return dimOrder.map(metricId => {
      const dim = results[metricId]
      dim.history = new Array(28).fill(1)
      dim.value = 0
      return dim
    })
  }

  // 1. Convert sparse backend array into a fast O(1) dictionary lookup
  const bucketMap = {}
  trendData.dailyBuckets.forEach(b => { bucketMap[b.date] = b })

  // 2. Generate exactly 28 trailing days based on the absolute period boundary
  let totalExpressionsProcessed = 0
  const anchorDateObj = new Date(anchorMs.value)

  // Loop backwards 27 days to 0 days ago
  for (let i = 27; i >= 0; i--) {
    const d = new Date(anchorDateObj)
    d.setUTCDate(d.getUTCDate() - i)
    const dateKey = d.toISOString().split('T')[0] // 'YYYY-MM-DD'

    // Lookup data for this calendar day
    const dayData = bucketMap[dateKey]

    dimOrder.forEach(metricId => {
      const val = dayData?.metrics ? (dayData.metrics[metricId] || 0) : 0
      results[metricId].history.push(val)
      results[metricId].totalCount += val
      totalExpressionsProcessed += val
    })
  }

  return dimOrder.map(metricId => {
    const dim = results[metricId]
    dim.value = totalExpressionsProcessed === 0 ? 0 : Math.round((dim.totalCount / totalExpressionsProcessed) * 100)
    
    // Fallback flatline if zero data
    if (dim.totalCount === 0) dim.history = new Array(28).fill(1)
    return dim
  })
})

const smartHighlight = (rawText, joyArray, targetMetric) => {
  if (!rawText) return ''
  const analysis = joyArray.find(j => j.metric === targetMetric)
  if (!analysis || !analysis.bits || analysis.bits.length === 0) return rawText

  const colorClass = dimConfig[targetMetric].highlightClass
  
  let expandedBits = analysis.bits.map(([start, end]) => {
    let s = start
    let e = end
    while (s > 0 && /\w/.test(rawText[s - 1])) s--
    while (e < rawText.length - 1 && /\w/.test(rawText[e + 1])) e++
    return [s, e]
  })

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

// 4. Verbatim Feed: Still strictly sources exact issue text from current period, bounded by anchor
const verbatimFeed = computed(() => {
  let examples = []
  const seenIds = new Set() 
  const issues = bloomStore.allIssues || []
  
  const now = anchorMs.value
  const dayInMs = 24 * 60 * 60 * 1000

  for (const issue of issues) {
    if (!issue.interactions) continue
    for (const interaction of issue.interactions) {
      if (!interaction.analysis?.joy) continue
      
      const timestamp = new Date(interaction.updatedAtSource || interaction.createdAt).getTime()
      const daysAgo = Math.floor((now - timestamp) / dayInMs)
      if (daysAgo < 0 || daysAgo >= 28) continue 

      if (seenIds.has(interaction.id)) continue 

      const validEmotions = interaction.analysis.joy.filter(j => j.bits && j.bits.length > 0)
      if (validEmotions.length === 0) continue

      if (selectedDimensionId.value) {
        if (validEmotions.some(j => j.metric === selectedDimensionId.value)) {
          examples.push(interaction)
          seenIds.add(interaction.id) 
        }
      } 
      else {
        const sortedEmotions = [...validEmotions].sort((a, b) => {
           return dimOrder.indexOf(a.metric) - dimOrder.indexOf(b.metric)
        })
        examples.push({ ...interaction, _primaryEmotion: sortedEmotions[0].metric })
        seenIds.add(interaction.id) 
      }
    }
  }

  return examples
    .sort((a, b) => new Date(b.updatedAtSource || b.createdAt).getTime() - new Date(a.updatedAtSource || a.createdAt).getTime())
    .slice(0, INTERACTION_LIST_LIMIT)
})

const getSparklineOption = (dim) => {
  const endLabel = isOngoingPeriod.value ? 'Today' : 'End'; // Dynamic label
  
  return {
    grid: { top: 5, right: 10, bottom: 15, left: 10 },
    xAxis: { 
      type: 'category', 
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: '#e2e8f0' } }, 
      axisLabel: { 
        showMinLabel: true, 
        showMaxLabel: true, 
        color: '#94a3b8', 
        fontSize: 9, 
        margin: 4, 
        // Use the dynamic endLabel here
        formatter: (value, index) => index === 0 ? '-28d' : (index === 27 ? endLabel : '') 
      }, 
      axisTick: { show: false }
    },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [
      {
        data: dim.history,
        type: 'line',
        smooth: 0.25,
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

const handleDimensionClick = async (dimId) => {
  selectedDimensionId.value = dimId
  
  // Only scroll on screens smaller than the `lg` breakpoint (1024px) where the layout stacks
  if (window.innerWidth < 1024) {
    await nextTick() // Wait for the DOM to update the feed below
    if (feedContainerRef.value) {
      // Scroll the feed container into the top of the viewport smoothly
      feedContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
</script>

<style scoped>
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>