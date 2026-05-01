<template>
  <div class="w-full md:w-[220px] shrink-0 flex flex-col sm:flex-row md:flex-col gap-6 sm:gap-4 md:gap-1.5 text-sm text-slate-500 md:border-l border-slate-100 md:pl-6 lg:pl-8 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
    
    <div class="flex flex-row flex-wrap sm:flex-col gap-x-6 gap-y-2 md:gap-y-1.5 flex-1 sm:w-1/2 md:w-full">
      <button @click.stop="openExplorer" class="flex items-center md:justify-between gap-2 md:gap-0 cursor-pointer group/btn w-full sm:w-auto text-left transition-colors">
        <span class="group-hover/btn:text-bloom-primary transition-colors">Reviews<span class="md:hidden">:</span></span>
        <span class="font-bold text-slate-900 group-hover/btn:text-bloom-primary transition-colors">{{ formatNumber(issue.interactions?.length || 0) }}</span>
      </button>

      <div v-if="activeSource === 'apple_app_store' && appleCountries.length > 0" class="flex items-center md:justify-between gap-2 md:gap-0">
        <span class="flex items-center gap-1.5">
          Countries 
          <svg class="w-3.5 h-3.5 text-slate-400 cursor-help outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Country data is tracked specifically for Apple App Store interactions.</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="md:hidden">:</span>
        </span>
        <span class="font-bold text-slate-900 text-right cursor-help" :title="fullCountryTooltip">
          {{ topCountriesLabel }}
        </span>
      </div>
      
      <div v-if="activeSource === 'google_play' && googleLangs.length > 0" class="flex items-center md:justify-between gap-2 md:gap-0">
        <span class="flex items-center gap-1.5">
          Languages 
          <svg class="w-3.5 h-3.5 text-slate-400 cursor-help outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Language data is tracked specifically for Google Play interactions.</title>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="md:hidden">:</span>
        </span>
        <span class="font-bold text-slate-900 text-right cursor-help" :title="fullLangTooltip">
          {{ topLangsLabel }}
        </span>
      </div>
      
      <div class="flex items-center md:justify-between gap-2 md:gap-0">
        <span>Upvotes<span class="md:hidden">:</span></span>
        <span class="font-bold text-slate-900">{{ formatNumber(issueStats.upvotes) }}</span>
      </div>
      
      <div class="flex items-center md:justify-between gap-2 md:gap-0">
        <span>Latest<span class="md:hidden">:</span></span>
        <span class="font-bold text-slate-900 whitespace-nowrap cursor-help text-right" :title="exactDate">
          {{ daysAgoLabel }}
        </span>
      </div>
    </div>

    <div class="flex flex-col flex-1 sm:w-1/2 md:w-full sm:justify-center md:justify-start md:mt-2 md:pt-3 md:border-t border-slate-100 gap-1 min-w-[120px]">
      <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <span>Period Trend</span>
      </div>
      <div class="h-12 sm:h-10 w-full relative -ml-1">
        <v-chart class="absolute inset-0 w-full h-full" :option="sparklineOption" autoresize />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts modules globally for this component (Added MarkLineComponent)
use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent])

const props = defineProps({
  issue: { type: Object, required: true },
  activeSource: { type: String, default: 'all' }
})

const ui = useUiStore()
const bloomStore = useBloomStore()
const router = useRouter()
const route = useRoute()

// --- FORMATTERS & UTILS ---
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('en-US')
}

// ---------------------------------------------------------
// COLOR THEME SWAPPER
// ---------------------------------------------------------
const activeChartColorName = 'primary' 
const CHART_COLORS = {
  primary: '#9A3356', 
  mono: '#C0406C',    
  olive: '#8A9A33',   
  teal: '#008080',    
  deepBlue: '#44339A' 
}
const activeChartColor = computed(() => CHART_COLORS[activeChartColorName] || CHART_COLORS.primary)

// ---------------------------------------------------------
// TIME MACHINE ANCHOR & STATS LOGIC
// ---------------------------------------------------------
// 🔥 FIX 1: Clamp anchor to "Today" so ongoing periods know where the future starts
const anchorMs = computed(() => {
  let targetMs = Date.now()
  if (bloomStore.ttmTrendData?.metadata?.anchorDate) {
    targetMs = new Date(bloomStore.ttmTrendData.metadata.anchorDate).getTime()
  }
  return Math.min(targetMs, Date.now())
})

const issueStats = computed(() => {
  let latestMs = 0
  let upvotes = 0

  if (props.issue.interactions && props.issue.interactions.length > 0) {
    props.issue.interactions.forEach(interaction => {
      // Strictly use updatedAtSource (or snake_case backend equivalent)
      const dateStr = interaction.updatedAtSource || interaction.updated_at_source
      if (dateStr) {
        const timestamp = new Date(dateStr).getTime()
        if (timestamp > latestMs) latestMs = timestamp
      }

      if (interaction.reactions && Array.isArray(interaction.reactions)) {
        const upvoteReaction = interaction.reactions.find(r => r.type === 'upvote')
        if (upvoteReaction) upvotes += (upvoteReaction.count || 0)
      }
    })
  }

  return {
    latestTimestamp: latestMs,
    upvotes: upvotes,
    daysAgo: latestMs ? Math.max(0, Math.floor((anchorMs.value - latestMs) / (1000 * 60 * 60 * 24))) : null
  }
})

const daysAgoLabel = computed(() => {
  const days = issueStats.value.daysAgo
  if (days === null) return 'N/A'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${formatNumber(days)} days ago`
})

const exactDate = computed(() => {
  if (!issueStats.value.latestTimestamp) return 'No interactions yet'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(issueStats.value.latestTimestamp))
})

// ---------------------------------------------------------
// LOCALE & REGION LOGIC
// ---------------------------------------------------------
const generateLabel = (dataArray) => {
  if (dataArray.length === 0) return 'N/A'
  const topTwo = dataArray.slice(0, 2).map(c => c[0]).join(', ')
  const remaining = dataArray.length - 2
  if (remaining > 0) return `${topTwo}, +${remaining}`
  return topTwo
}

const generateTooltip = (dataArray) => {
  return dataArray.map(([key, count]) => `${key}: ${formatNumber(count)}`).join(' | ')
}

const appleCountries = computed(() => {
  if (!props.issue.interactions) return []
  const counts = {}
  props.issue.interactions.forEach(int => {
    if ((int.sourceId === 'apple_app_store' || int.source_id === 'apple_app_store') && int.country && int.country !== 'global' && int.country !== 'default') {
      const code = int.country.toUpperCase()
      counts[code] = (counts[code] || 0) + 1
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const googleLangs = computed(() => {
  if (!props.issue.interactions) return []
  const counts = {}
  props.issue.interactions.forEach(int => {
    if ((int.sourceId === 'google_play' || int.source_id === 'google_play') && int.lang && int.lang !== 'global' && int.lang !== 'default') {
      const code = int.lang.toUpperCase()
      counts[code] = (counts[code] || 0) + 1
    }
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const topCountriesLabel = computed(() => generateLabel(appleCountries.value))
const fullCountryTooltip = computed(() => generateTooltip(appleCountries.value))
const topLangsLabel = computed(() => generateLabel(googleLangs.value))
const fullLangTooltip = computed(() => generateTooltip(googleLangs.value))

// ---------------------------------------------------------
// PERIOD SPARKLINE LOGIC
// ---------------------------------------------------------
const getBloomRange = (periodKey) => {
  if (!periodKey) return null
  const regex = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(w)?)?|Q(\d)|-W(\d{1,2}))?$/i
  const matches = periodKey.trim().match(regex)
  if (!matches) return null

  const year = parseInt(matches[1], 10)
  const month = matches[2] ? parseInt(matches[2], 10) : null
  const quarter = matches[5] ? parseInt(matches[5], 10) : null

  let startDate, endDate

  if (month) {
    startDate = new Date(Date.UTC(year, month - 1, 1))
    endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  } else if (quarter) {
    const startMonth = (quarter - 1) * 3
    startDate = new Date(Date.UTC(year, startMonth, 1))
    endDate = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999))
  } else {
    startDate = new Date(Date.UTC(year, 0, 1))
    endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  }

  return { start: startDate, end: endDate }
}

const sparklineOption = computed(() => {
  const periodKey = route.params.periodId || route.query.periodId || bloomStore.ttmTrendData?.metadata?.bloomKey
  const range = getBloomRange(periodKey)
  
  let categories = []
  let historyData = []
  const currentAnchor = anchorMs.value
  
  let hasFutureBars = false
  let todayKey = null
  
  if (range) {
    const durationDays = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
    
    let bucketMode = 'day'
    if (durationDays > 100) bucketMode = 'month' 
    else if (durationDays > 35) bucketMode = 'week' 
    
    const buckets = []
    let cursor = new Date(range.start.getTime())

    if (bucketMode === 'month') {
      while (cursor <= range.end) {
        const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`
        buckets.push({ key, startMs: cursor.getTime(), count: 0 })
        cursor.setUTCMonth(cursor.getUTCMonth() + 1)
      }
    } else if (bucketMode === 'week') {
      while (cursor <= range.end) {
        const key = cursor.getTime().toString()
        buckets.push({ 
          key, 
          startMs: cursor.getTime(), 
          endMs: cursor.getTime() + (7 * 86400000) - 1, 
          count: 0 
        })
        cursor.setUTCDate(cursor.getUTCDate() + 7)
      }
    } else {
      while (cursor <= range.end) {
        const key = cursor.toISOString().split('T')[0]
        buckets.push({ key, startMs: cursor.getTime(), count: 0 })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
    }

    if (props.issue.interactions) {
      props.issue.interactions.forEach(interaction => {
        const dateStr = interaction.updatedAtSource || interaction.updated_at_source
        if (!dateStr) return
        
        const t = new Date(dateStr)
        const ms = t.getTime()
        
        if (ms >= range.start.getTime() && ms <= range.end.getTime()) {
          if (bucketMode === 'month') {
            const k = `${t.getUTCFullYear()}-${t.getUTCMonth()}`
            const b = buckets.find(x => x.key === k)
            if (b) b.count += 1
          } else if (bucketMode === 'week') {
            const b = buckets.find(x => ms >= x.startMs && ms <= x.endMs)
            if (b) b.count += 1
          } else {
            const k = t.toISOString().split('T')[0]
            const b = buckets.find(x => x.key === k)
            if (b) b.count += 1
          }
        }
      })
    }

    categories = buckets.map(b => b.key)
    
    // Pre-calculate if we have future bars, and exactly which key is "Today"
    hasFutureBars = buckets.some(b => b.startMs > currentAnchor)
    if (hasFutureBars) {
      // Find the very last bucket that is NOT in the future
      const todayBucket = [...buckets].reverse().find(b => b.startMs <= currentAnchor)
      if (todayBucket) todayKey = todayBucket.key
    }
    
    // Apply the green color specifically to the "Today" bar
    historyData = buckets.map(b => {
      const isFuture = b.startMs > currentAnchor
      const isToday = b.key === todayKey

      let barColor = activeChartColor.value
      if (isFuture) barColor = '#f1f5f9'
      else if (isToday) barColor = '#8a9a33' // Emerald-500 Green

      return {
        value: b.count,
        itemStyle: {
          color: barColor,
          borderRadius: [2, 2, 0, 0]
        }
      }
    })
  } else {
    categories = Array.from({ length: 28 }, (_, i) => i)
    historyData = Array.from({ length: 28 }, () => ({
      value: 0,
      itemStyle: { color: '#f1f5f9', borderRadius: [2, 2, 0, 0] }
    }))
  }

  const seriesConfig = {
    data: historyData,
    type: 'bar',
    barMinHeight: 3, 
    barWidth: '70%'
  }

  // 🔥 Inject the "Now" indicator with text
  if (hasFutureBars && todayKey) {
    seriesConfig.markLine = {
      symbol: ['none', 'none'],
      silent: true,
      label: { 
        show: true, 
        position: 'end', // Places it at the top of the line
        formatter: 'Today', // The text to display
        color: '#8a9a33', 
        fontSize: 9,
        fontWeight: 'bold'
      },
      lineStyle: { 
        color: '#8a9a33', 
        type: 'dashed', 
        width: 1.5, 
        opacity: 0.8 
      },
      data: [{ xAxis: todayKey }]
    }
  }

  return {
    // Increased 'top' from 5 to 15 to make room for the "Now" text
    grid: { top: 15, right: 0, bottom: 0, left: 0 }, 
    xAxis: { 
      type: 'category', 
      data: categories, 
      show: false,
      boundaryGap: true 
    },
    yAxis: { 
      type: 'value', 
      show: false, 
      min: 0, 
      max: (value) => value.max > 0 ? value.max : 1 
    },
    series: [seriesConfig]
  }
})

// --- ACTIONS ---
const openExplorer = () => {
  if (!props.issue.taxo) return
  const safeTaxo = props.issue.taxo.replaceAll(':', '-')
  ui.navigateWithGrace('interactions', { exploreIssue: safeTaxo }, route, router)
}
</script>
