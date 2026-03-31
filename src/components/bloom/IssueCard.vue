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

      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <span class="bg-rose-50 text-rose-700 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          {{ impactLabel }} Impact
        </span>
        <span class="bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider">
          {{ confidenceLabel }} Confidence
        </span>

        <button @click.stop="copyLink" class="text-slate-400 hover:text-bloom-primary transition-colors shrink-0 ml-1" title="Copy Link to Issue">
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
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

      <div class="w-full md:w-[220px] shrink-0 flex flex-row flex-wrap md:flex-col gap-x-6 gap-y-3 md:gap-4 text-sm text-slate-500 md:border-l border-slate-100 md:pl-6 lg:pl-8 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
        
        <div class="flex items-center md:justify-between gap-2 md:gap-0">
          <span>Reviews<span class="md:hidden">:</span></span>
          <span class="font-bold text-slate-900">{{ formatNumber(issue.interactions?.length || 0) }}</span>
        </div>

        <div class="flex items-center md:justify-between gap-2 md:gap-0">
          <span>Countries<span class="md:hidden">:</span></span>
          <span class="font-bold text-slate-900 text-right cursor-help" :title="fullCountryTooltip">
            {{ topCountriesLabel }}
          </span>
        </div>
        
        <div class="flex items-center md:justify-between gap-2 md:gap-0">
          <span>Upvotes<span class="md:hidden">:</span></span>
          <span class="font-bold text-slate-900">{{ formatNumber(issue.upvoteCount || 0) }}</span>
        </div>
        
        <div class="flex items-center md:justify-between gap-2 md:gap-0">
          <span>Updated<span class="md:hidden">:</span></span>
          <span 
            class="font-bold text-slate-900 whitespace-nowrap cursor-help text-right" 
            :title="exactDate"
          >
            {{ daysAgo }}
          </span>
        </div>
        
        <div class="flex items-center md:justify-between gap-2 md:gap-0 md:mt-3 md:pt-4 md:border-t border-slate-100">
          <span>Class<span class="md:hidden">:</span></span>
          <span class="font-bold text-slate-900 capitalize whitespace-nowrap">
            {{ issue.class === 'non-actionable' ? 'General Feedback' : 'Backlog Candidate' }}
          </span>
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
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const props = defineProps({
  issue: { type: Object, required: true },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const router = useRouter()
const route = useRoute()

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return Number(num).toLocaleString('en-US')
}

// --- COUNTRY SORTING & DISPLAY ---
const sortedCountryData = computed(() => {
  if (!props.issue.interactions || props.issue.interactions.length === 0) return []
  
  // Tally interactions by country
  const counts = {}
  props.issue.interactions.forEach(interaction => {
    // Fallback to '??' if country is null/undefined in the raw data
    const country = (interaction.country || '??').toUpperCase()
    counts[country] = (counts[country] || 0) + 1
  })

  // Convert to array and sort highest to lowest
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const topCountriesLabel = computed(() => {
  const data = sortedCountryData.value
  if (data.length === 0) return 'N/A'
  
  const topTwo = data.slice(0, 2).map(c => c[0]).join(', ')
  const remaining = data.length - 2
  
  if (remaining > 0) return `${topTwo}, +${remaining}`
  return topTwo
})

const fullCountryTooltip = computed(() => {
  const data = sortedCountryData.value
  if (data.length === 0) return ''
  return data.map(([country, count]) => `${country}: ${formatNumber(count)}`).join(' | ')
})


// --- OTHER LABELS & LOGIC ---
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

const daysAgo = computed(() => {
  if (!props.issue.latestInteractionMsAgo) return 'Today'
  const days = Math.floor(props.issue.latestInteractionMsAgo / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${formatNumber(days)} days ago`
})

// SAFELY GET TAXO
const getCategoryTaxo = computed(() => {
  if (props.issue.category?.taxo) return props.issue.category.taxo
  if (props.issue.taxo) return props.issue.taxo.split(':')[0]
  return null
})

const getTopicTaxo = computed(() => {
  if (props.issue.topic?.taxo) return props.issue.topic.taxo
  if (props.issue.taxo) {
    const parts = props.issue.taxo.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}` // e.g., "other:all"
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
  const newQuery = { ...route.query }
  
  if (newQuery.taxo === safeTaxo) {
    delete newQuery.taxo
  } else {
    newQuery.taxo = safeTaxo
    // Pops the sidebar open when they click the breadcrumb!
    ui.isRightOpen = true 
    ui.activeRightTab = 'taxonomy' 
  }
  
  router.push({ query: newQuery })
}

const toggleCategory = () => {
  toggleTaxo(getCategoryTaxo.value)
}

const toggleTopic = () => {
  toggleTaxo(getTopicTaxo.value)
}

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
  url.searchParams.set('taxo', safeTaxo)
  navigator.clipboard.writeText(url.toString())
}

// --- EXACT DATE TOOLTIP ---
const exactDate = (() => {
  const timestamp = Date.now() - (props.issue.latestInteractionMsAgo || 0)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric', 
    minute: '2-digit'
  }).format(new Date(timestamp))
})()

</script>
