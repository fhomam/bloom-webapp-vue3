<template>
  <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full w-full">
    
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Top Drivers
      </h3>
      <span class="text-xs font-medium text-slate-400">By Volume</span>
    </div>

    <div class="flex p-1 bg-slate-100 rounded-lg mb-4 self-start shrink-0">
      <button 
        v-for="tab in taxonomyTabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all', 
          activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="flex flex-col flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
      
      <button 
        v-for="(item, index) in currentList" 
        :key="item.id"
        @click="goToTaxonomy(item)"
        class="relative flex items-start justify-between py-2 px-2 rounded-lg group hover:bg-slate-50 transition-colors cursor-pointer w-full text-left"
      >
        <div 
          class="absolute inset-y-1 left-1 bg-slate-100/60 rounded-md -z-10 transition-all duration-500"
          :style="{ width: `${(item.interactions / maxInteractions) * 98}%` }"
        ></div>

        <div class="flex items-start gap-3 overflow-hidden pr-4 z-10 w-full mt-0.5">
          <span class="text-[10px] font-bold text-slate-400 w-3 text-right shrink-0 mt-[2px] group-hover:text-bloom-primary transition-colors">
            {{ index + 1 }}
          </span>
          
          <div class="flex flex-col min-w-0 flex-1 gap-0.5">
            <span class="text-sm font-semibold text-slate-800 truncate group-hover:text-bloom-primary transition-colors" :title="item.title">
              {{ item.title }}
            </span>
            
            <span v-if="item.type === 'category'" class="text-[10px] text-slate-500 font-medium truncate">
              {{ item.topicCount }} {{ item.topicCount === 1 ? 'Topic' : 'Topics' }} &bull; {{ item.issueCount }} {{ item.issueCount === 1 ? 'Packet' : 'Packets' }}
            </span>
            <span v-else-if="item.type === 'topic'" class="text-[10px] text-slate-500 font-medium truncate">
              {{ item.issueCount }} {{ item.issueCount === 1 ? 'Packet' : 'Packets' }} &bull; <span class="text-slate-400">In {{ item.parentTitle }}</span>
            </span>
            <span v-else-if="item.type === 'issue'" class="text-[10px] text-slate-500 font-medium truncate">
              {{ item.latestDateLabel }} &bull; <span class="text-slate-400">In {{ item.parentTitle }}</span>
            </span>
          </div>
        </div>

        <div class="flex flex-col items-end shrink-0 z-10 ml-2">
          <span class="text-sm font-bold text-slate-900 leading-none">
            {{ formattedNumber(item.interactions) }}
          </span>
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Interactions
          </span>
        </div>
        
      </button>

      <div v-if="currentList.length === 0" class="text-center text-xs text-slate-400 italic py-6">
        No {{ activeTab }} available.
      </div>

    </div>

    <div class="mt-4 pt-4 border-t border-slate-100 shrink-0">
      <RouterLink :to="exploreTaxonomyUrl" class="inline-flex text-xs font-bold text-bloom-primary hover:text-indigo-800 transition-colors items-center gap-1">
        Explore Taxonomy Tree
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </RouterLink>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBloomStore } from '@/stores/bloom'

const route = useRoute()
const router = useRouter()
const bloomStore = useBloomStore()

const activeTab = ref('categories')

const taxonomyTabs = [
  { id: 'categories', label: 'Categories' },
  { id: 'topics', label: 'Topics' },
  { id: 'issues', label: 'Packets' } 
]

// --- UTILS ---
const formattedNumber = (num) => {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
}

const getRelativeDateLabel = (timestampMs) => {
  if (!timestampMs) return 'No Date'
  const days = Math.floor((Date.now() - timestampMs) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Updated Today'
  if (days === 1) return 'Updated 1 day ago'
  return `Updated ${days} days ago`
}

// --- DATA ENGINE ---
const aggregatedData = computed(() => {
  const cats = []
  const tops = []
  const isss = []

  const rootCategories = bloomStore.currentBloom?.categories || []

  rootCategories.forEach(c => {
    let cIntCount = 0
    let cIssueCount = 0
    let cTopicCount = c.topics?.length || 0
    const categoryTitle = c.title || c.taxo

    c.topics?.forEach(t => {
      let tIntCount = 0
      let tIssueCount = t.issues?.length || 0
      const topicTitle = t.title || t.taxo

      t.issues?.forEach(i => {
        let iIntCount = 0
        let latestMs = 0

        // Calculate exact counts and latest date
        if (i.interactions) {
          iIntCount = i.interactions.length
          i.interactions.forEach(int => {
            const dateStr = int.updatedAtSource || int.createdAt
            if (dateStr) {
              const ts = new Date(dateStr).getTime()
              if (ts > latestMs) latestMs = ts
            }
          })
        }

        tIntCount += iIntCount
        cIntCount += iIntCount

        isss.push({
          id: i.id,
          title: i.title || i.taxo,
          taxo: i.taxo,
          interactions: iIntCount,
          parentTitle: topicTitle,
          latestDateLabel: getRelativeDateLabel(latestMs), // 🔥 Added formatted date
          type: 'issue'
        })
      })

      cIssueCount += tIssueCount

      tops.push({
        id: t.id,
        title: topicTitle,
        taxo: t.taxo,
        interactions: tIntCount,
        issueCount: tIssueCount,
        parentTitle: categoryTitle,
        type: 'topic'
      })
    })

    cats.push({
      id: c.id,
      title: categoryTitle,
      taxo: c.taxo,
      interactions: cIntCount,
      topicCount: cTopicCount,
      issueCount: cIssueCount,
      type: 'category'
    })
  })

  // Returns arrays strictly capped at top 3 (or 5, depending on height)
  return {
    categories: cats.sort((a, b) => b.interactions - a.interactions).slice(0, 3),
    topics: tops.sort((a, b) => b.interactions - a.interactions).slice(0, 3),
    issues: isss.sort((a, b) => b.interactions - a.interactions).slice(0, 3)
  }
})

const currentList = computed(() => aggregatedData.value[activeTab.value] || [])

const maxInteractions = computed(() => {
  if (currentList.value.length === 0) return 1
  return currentList.value[0].interactions
})

// --- NAVIGATION ---

// 🔥 Click handler for individual rows
const goToTaxonomy = (item) => {
  const { orgXid, offeringType, offeringXid, periodType, periodId } = route.params
  
  if (!orgXid || !offeringXid || !periodId) return

  // Format taxo for the URL (replace colons with dashes if your router requires it)
  const safeTaxo = item.taxo ? item.taxo.replaceAll(':', '-') : ''

  // Preserve all existing query parameters (like srcId, country, theme)
  const queryToPreserve = { ...route.query, taxo: safeTaxo }

  router.push({
    path: `/${orgXid}/reports/${offeringType}/${offeringXid}/${periodType}/${periodId}`,
    query: queryToPreserve
  })
}

// "Explore All" link at bottom
const exploreTaxonomyUrl = computed(() => {
  const { orgXid, offeringType, offeringXid, periodType, periodId } = route.params
  
  if (!orgXid || !offeringXid || !periodId) return ''
  
  const topCategory = aggregatedData.value?.categories?.[0]
  const safeTaxo = topCategory ? topCategory.taxo.replaceAll(':', '-') : ''
  
  // Construct a raw query string to preserve existing filters
  const currentQuery = new URLSearchParams(route.query)
  if (safeTaxo) currentQuery.set('taxo', safeTaxo)

  return `/${orgXid}/reports/${offeringType}/${offeringXid}/${periodType}/${periodId}?${currentQuery.toString()}`
})

</script>
