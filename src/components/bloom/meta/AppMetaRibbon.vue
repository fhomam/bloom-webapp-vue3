<template>
  <div class="flex flex-col md:flex-row items-center justify-between py-6 px-2 border-b border-slate-100 bg-white">
    
    <div class="flex items-center gap-8 md:gap-12">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">{{ appName }}</h2>
        <p class="text-xs text-slate-500 font-medium tracking-wide mt-0.5">{{ developerName }}</p>
      </div>

      <div class="hidden sm:block">
        <div class="flex items-center gap-1">
          <h2 class="text-xl font-bold text-slate-900">{{ ratingScore }}</h2>
          <span class="text-[#FFC107] text-lg -mt-0.5">★</span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">from {{ ratingCount }} ratings</p>
      </div>

      <div class="hidden sm:block">
        <h2 class="text-xl font-bold text-slate-900">{{ price }}</h2>
        <p class="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">{{ currency }}</p>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4 md:mt-0">
      <MinimalDropdown 
        v-model="activeSource" 
        :options="sourceOptions"
      />
      <div class="w-px h-4 bg-slate-200"></div>
      <MinimalDropdown 
        v-model="activeCountry" 
        :options="countryOptions"
      />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MinimalDropdown from '@/components/common/MinimalDropdown.vue'

const props = defineProps({
  app: { type: Object, required: true },
  sourceStats: { type: Object, default: () => ({}) },
  countryStats: { type: Object, default: () => ({}) }
})

const router = useRouter()
const route = useRoute()

// --- URL Syncing Logic ---
const activeSource = computed({
  get: () => route.query.srcId || 'all',
  set: (val) => updateUrl('srcId', val)
})

const activeCountry = computed({
  get: () => route.query.country || 'all',
  set: (val) => updateUrl('country', val)
})

const updateUrl = (key, value) => {
  const query = { ...route.query }
  if (value === 'all') delete query[key]
  else query[key] = value
  router.push({ query })
}

// --- Formatters ---
const formatNum = (num) => {
  if (num > 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

const appName = computed(() => props.app?.name || 'Loading...')
const developerName = computed(() => props.app?.developer?.name ? `by ${props.app.developer.name}` : '')
const ratingScore = computed(() => props.app?.userRating?.averageScore?.toFixed(1) || '0.0')
const ratingCount = computed(() => formatNum(props.app?.userRating?.count || 0))
const price = computed(() => props.app?.price ? props.app.price : 'Free')
const currency = computed(() => props.app?.currency || '')

// --- Dropdown Options Logic (Mimicking your legacy logic) ---
const sourceOptions = computed(() => {
  const list = [{ id: 'all', label: 'All', subLabel: 'Sources' }]
  if (props.sourceStats?.apple_app_store) {
    list.push({ id: 'appstore', label: 'App Store', subLabel: props.sourceStats.apple_app_store })
  }
  if (props.sourceStats?.google_play) {
    list.push({ id: 'gplay', label: 'Google Play', subLabel: props.sourceStats.google_play })
  }
  return list
})

const countryOptions = computed(() => {
  const list = [{ id: 'all', label: 'All', subLabel: 'Countries' }]
  
  // Logic to extract countries from your nested JSON structure based on active source
  let countryMap = {}
  const targetSource = activeSource.value === 'appstore' ? 'apple_app_store' : (activeSource.value === 'gplay' ? 'google_play' : 'all')

  if (targetSource === 'all') {
    Object.values(props.countryStats || {}).forEach(countries => {
      Object.entries(countries).forEach(([country, count]) => {
        countryMap[country] = (countryMap[country] || 0) + count
      })
    })
  } else if (props.countryStats && props.countryStats[targetSource]) {
    countryMap = { ...props.countryStats[targetSource] }
  }

  Object.entries(countryMap).forEach(([country, count]) => {
    list.push({
      id: country,
      label: country.toUpperCase(),
      subLabel: `${count} review${count !== 1 ? 's' : ''}`
    })
  })

  return list
})
</script>
