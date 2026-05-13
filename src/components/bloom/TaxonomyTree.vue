<template>
  <div class="flex flex-col h-full w-full bg-white relative">

    <div class="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4 shrink-0">
      <div class="flex flex-col min-w-0">
        <h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Taxonomy Explorer
        </h2>
        <div class="text-[17px] font-bold text-slate-900 leading-tight truncate">
          Report Categories
        </div>
      </div>
      <button @click="urlState.closePanel" class="p-2 -mr-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-full transition-colors shrink-0">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="overflow-y-auto pt-4 pb-10 custom-scrollbar flex-1 px-3">
      
      <div v-if="!treeData.length" class="text-center py-10 text-slate-400 text-sm">
        No taxonomy data available.
      </div>

      <div v-for="category in treeData" :key="category.id" class="mb-1.5">
        
        <div 
          :id="toNodeId(category.taxo)"
          @click="selectNode(category.taxo)"
          :class="[
            'group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
            isActive(category.taxo) ? 'bg-bloom-primary/10' : 'hover:bg-slate-100'
          ]"
        >
          <div class="flex items-center gap-2 min-w-0">
            <button 
              @click.stop="toggleExpand(category.taxo)" 
              class="w-5 h-5 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <svg v-if="isExpanded(category.taxo)" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
            </button>
            <span :class="['text-[14px] font-bold truncate', isActive(category.taxo) ? 'text-bloom-primary' : 'text-slate-700']">
              {{ category.title || 'General' }}
            </span>
          </div>
          <span class="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
            {{ formatNumber(category.count) }}
          </span>
        </div>

        <div v-show="isExpanded(category.taxo)" class="pl-6 pr-1 mt-1 flex flex-col gap-1 border-l-2 border-slate-200/60 ml-4">
          <div v-for="topic in category.topics" :key="topic.id">
            
            <div 
              :id="toNodeId(topic.taxo)"
              @click="selectNode(topic.taxo)"
              :class="[
                'group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors',
                isActive(topic.taxo) ? 'bg-bloom-primary/10' : 'hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-1.5 min-w-0">
                <button 
                  @click.stop="toggleExpand(topic.taxo)" 
                  class="w-4 h-4 flex items-center justify-center shrink-0 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <svg v-if="isExpanded(topic.taxo)" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                </button>
                <span :class="['text-[13px] font-semibold truncate', isActive(topic.taxo) ? 'text-bloom-primary' : 'text-slate-600']">
                  {{ topic.title || 'Misc' }}
                </span>
              </div>
              <span class="text-slate-400 text-[11px] font-semibold shrink-0">
                {{ formatNumber(topic.count) }}
              </span>
            </div>

            <div v-show="isExpanded(topic.taxo)" class="pl-4 mt-0.5 mb-1.5 flex flex-col gap-0.5 border-l border-slate-200/60 ml-3.5">
              <div 
                v-for="issue in topic.issues" 
                :key="issue.id"
                :id="toNodeId(issue.taxo)"
                @click="selectNode(issue.taxo)"
                :class="[
                  'group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors',
                  isActive(issue.taxo) ? 'bg-bloom-primary/10' : 'hover:bg-slate-100'
                ]"
              >
                <span :class="['text-[12.5px] truncate pr-3', isActive(issue.taxo) ? 'text-bloom-primary font-semibold' : 'text-slate-500 font-medium group-hover:text-slate-800']" :title="issue.title">
                  {{ issue.title || 'Untitled Issue' }}
                </span>
                <span class="text-slate-400/70 text-[10px] font-bold shrink-0">
                  {{ formatNumber(issue.count) }}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useBloomStore } from '@/stores/bloom'
import { useBloomUrlState } from '@/composables/useBloomUrlState'

const bloomStore = useBloomStore()
const urlState = useBloomUrlState()

const formatNumber = (num) => Number(num || 0).toLocaleString('en-US')

// DOM ids use a CSS-safe separator (colons would parse as pseudo-class in
// querySelector). Local to this file — URLs and route.query stay colon-form.
const toNodeId = (taxo) => `node-${taxo.replaceAll(':', '__')}`

const treeData = computed(() => {
  if (!bloomStore.currentBloom?.categories) return []
  return bloomStore.currentBloom.categories.map(cat => {
    let catCount = 0
    const topics = cat.topics.map(top => {
      let topCount = 0
      const issues = top.issues.map(iss => {
        const count = iss.interactions?.length || 0
        topCount += count
        return { ...iss, count }
      }).sort((a, b) => b.count - a.count)
      
      catCount += topCount
      return { ...top, count: topCount, issues }
    }).sort((a, b) => b.count - a.count)
    
    return { ...cat, count: catCount, topics }
  }).sort((a, b) => b.count - a.count)
})

const expandedNodes = ref(new Set())
const isExpanded = (taxo) => expandedNodes.value.has(taxo)

const toggleExpand = (taxo) => {
  const newSet = new Set(expandedNodes.value)
  if (newSet.has(taxo)) newSet.delete(taxo)
  else newSet.add(taxo)
  expandedNodes.value = newSet
}

const isActive = (taxo) => {
  if (!urlState.taxo.value || !taxo) return false
  return urlState.taxo.value === taxo || urlState.taxo.value.startsWith(`${taxo}:`)
}

// Click toggles taxo: reclicking the active node clears it. The panel
// is already taxonomy here (this component only renders inside it), so
// we don't need to touch panel state — just taxo.
const selectNode = (taxo) => {
  if (urlState.taxo.value === taxo) {
    urlState.setTaxo(null)
  } else {
    urlState.setTaxo(taxo)
  }
}

// --- AUTO-SCROLL LOGIC ---
const scrollToNode = async (taxo) => {
  await nextTick() 
  const el = document.getElementById(toNodeId(taxo))
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

watch(() => urlState.taxo.value, (newTaxo) => {
  if (newTaxo) {
    const parts = newTaxo.split(':')
    
    // Auto-expand parents
    if (parts.length > 0) expandedNodes.value.add(parts[0]) 
    if (parts.length > 1) expandedNodes.value.add(`${parts[0]}:${parts[1]}`)
    
    // Auto-scroll to the exact node
    scrollToNode(newTaxo)
  }
}, { immediate: true })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
}
</style>