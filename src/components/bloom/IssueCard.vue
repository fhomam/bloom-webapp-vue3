<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group overflow-hidden mb-6">
    
    <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
      
      <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide min-w-0">
        <span class="w-10 sm:w-12 shrink-0">{{ formatNumber(index + 1) }} / {{ formatNumber(total) }}</span>
        <span class="shrink-0">•</span>
        <button @click.stop="toggleCategory" :class="['hover:text-bloom-primary transition-colors text-left truncate max-w-[150px] sm:max-w-none', isTaxoActive(getCategoryTaxo) ? 'text-slate-800' : '']">
          {{ issue.categoryTitle || 'General' }}
        </button>
        <span class="shrink-0">▸</span>
        
        <button @click.stop="toggleTopic" :class="['hover:text-bloom-primary transition-colors text-left truncate max-w-[150px] sm:max-w-none', isTaxoActive(getTopicTaxo) ? 'text-slate-800' : '']">
          {{ issue.topicTitle || 'Misc' }}
        </button>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0 relative">
        <span class="bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          {{ impactLabel }} Impact
        </span>
        <span class="bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider">
          {{ confidenceLabel }} Confidence
        </span>

        <button @click.stop="copyLink" class="text-slate-400 hover:text-bloom-primary transition-colors shrink-0 ml-1 relative flex items-center justify-center w-6 h-6" title="Copy Link to Issue">
          <transition name="fade" mode="out-in">
            <svg v-if="!isCopied" class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            <svg v-else class="w-4.5 h-4.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </transition>
        </button>
      </div>
    </div>

    <div class="px-5 py-6 flex flex-col md:flex-row gap-6 lg:gap-8">
      
      <div class="flex-1 min-w-0">
        <h3 class="text-lg md:text-xl font-bold text-slate-900 group-hover:text-bloom-primary transition-colors break-words">
          {{ issue.title || 'Untitled Issue' }}
        </h3>
        <p class="mt-2.5 text-[15px] md:text-base text-slate-600 leading-relaxed break-words">
          {{ issue.description?.summary || 'No summary provided.' }}
        </p>
        
        <ol v-if="issue.description?.entries?.length" class="mt-4 space-y-2 list-decimal list-outside pl-4 text-[15px] text-slate-700">
          <li v-for="(entry, i) in issue.description.entries" :key="i" class="pl-1">{{ entry }}</li>
        </ol>
      </div>

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
    </div>

    <div class="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4 sm:gap-0">
      <RouterLink :to="`/t/${issue.silkSnapId}`" class="text-[15px] font-semibold text-bloom-primary hover:text-bloom-mono transition-colors flex items-center gap-1.5 shrink-0">
        Open Silk Ticket &rarr;
      </RouterLink>
      
      <div class="flex flex-wrap gap-2.5 justify-start sm:justify-end w-full sm:w-auto">
        <button 
          v-for="theme in issue.themes" 
          :key="theme.id" 
          @click.stop="toggleTheme(theme.themeId)" 
          :class="[
            'px-3 py-1.5 rounded text-xs font-bold tracking-wide transition-colors border', 
            isThemeActive(theme.themeId) ? 'bg-bloom-accent2 text-white border-bloom-accent2' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          ]"
        >
          {{ theme.name }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useBloomStore } from '@/stores/bloom'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent])

const ui = useUiStore()
const bloomStore = useBloomStore()

const props = defineProps({
  issue: { type: Object, required: true },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const router = useRouter()
const route = useRoute()
const isCopied = ref(false)

const activeSource = computed(() => route.query.srcId || 'all')

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('en-US')
}

const activeChartColorName = 'primary' 
const CHART_COLORS = {
  primary: '#9A3356', 
  mono: '#C0406C',    
  olive: '#8A9A33',   
  teal: '#008080',    
  deepBlue: '#44339A' 
}
const activeChartColor = computed(() => CHART_COLORS[activeChartColorName] || CHART_COLORS.primary)

const anchorMs = computed(() => {
  if (bloomStore.ttmTrendData?.metadata?.anchorDate) {
    return new Date(bloomStore.ttmTrendData.metadata.anchorDate).getTime()
  }
  return Date.now()
})

const issueStats = computed(() => {
  let latestMs = 0
  let upvotes = 0

  if (props.issue.interactions && props.issue.interactions.length > 0) {
    props.issue.interactions.forEach(interaction => {
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
  // FIX: Accessing periodId from the exact router schema you provided
  const periodKey = route.params.periodId || route.query.periodId || bloomStore.ttmTrendData?.metadata?.bloomKey
  const range = getBloomRange(periodKey)
  
  let categories = []
  let historyData = []
  
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
        buckets.push({ key, count: 0 })
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
        buckets.push({ key, count: 0 })
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
    historyData = buckets.map(b => b.count)
  } else {
    categories = Array.from({ length: 28 }, (_, i) => i)
    historyData = new Array(28).fill(0) 
  }

  return {
    grid: { top: 2, right: 0, bottom: 0, left: 0 },
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
    series: [
      {
        data: historyData,
        type: 'bar',
        barMinHeight: 3, 
        barWidth: '70%', 
        itemStyle: {
          color: activeChartColor.value,
          borderRadius: [2, 2, 0, 0]
        }
      }
    ]
  }
})

// --- OTHER LABELS & LOGIC (Unchanged) ---
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

const impactLabel = computed(() => {
  const val = props.issue.rice?.impact?.value || 0
  if (val > 1) return 'High'
  if (val === 1) return 'Med'
  return 'Low'
})

const confidenceLabel = computed(() => {
  const val = props.issue.rice?.confidence?.value || 50
  if (val >= 80) return 'High'
  if (val >= 50) return 'Med'
  return 'Low'
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

const openExplorer = () => {
  if (!props.issue.taxo) return
  const safeTaxo = props.issue.taxo.replaceAll(':', '-')
  ui.navigateWithGrace('interactions', { exploreIssue: safeTaxo }, route, router)
}

const getCategoryTaxo = computed(() => {
  if (props.issue.category?.taxo) return props.issue.category.taxo
  if (props.issue.taxo) return props.issue.taxo.split(':')[0]
  return null
})

const getTopicTaxo = computed(() => {
  if (props.issue.topic?.taxo) return props.issue.topic.taxo
  if (props.issue.taxo) {
    const parts = props.issue.taxo.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}` 
    return props.issue.taxo
  }
  return null
})

const isTaxoActive = (taxo) => {
  if (!taxo || !route.query.taxo) return false
  return route.query.taxo === taxo.replaceAll(':', '-')
}

const isThemeActive = (themeId) => route.query.theme === themeId

const toggleTaxo = (taxo) => {
  if (!taxo) return
  const safeTaxo = taxo.replaceAll(':', '-')

  if (route.query.taxo === safeTaxo) {
    const newQuery = { ...route.query }
    delete newQuery.taxo
    router.push({ query: newQuery })
  } else {
    ui.navigateWithGrace('taxonomy', { 
      taxo: safeTaxo,
      exploreIssue: null, 
      exploreEmotion: null 
    }, route, router)
  }
}

const toggleCategory = () => toggleTaxo(getCategoryTaxo.value)
const toggleTopic = () => toggleTaxo(getTopicTaxo.value)

const toggleTheme = (themeId) => {
  const newQuery = { ...route.query }
  if (newQuery.theme === themeId) delete newQuery.theme 
  else newQuery.theme = themeId 
  router.push({ query: newQuery })
}

const copyLink = () => {
  if (!props.issue.taxo) return
  const safeTaxo = props.issue.taxo.replaceAll(':', '-')
  
  const url = new URL(window.location.href)
  url.search = `?taxo=${safeTaxo}` // Clean slate, exactly one param
  
  navigator.clipboard.writeText(url.toString()).then(() => {
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  })
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>