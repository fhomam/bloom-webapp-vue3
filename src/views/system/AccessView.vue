<template>
  <div class="flex-1 flex items-center justify-center px-6 py-12">
    <div class="max-w-md text-center">
      <div class="w-14 h-14 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
        <LockIcon class="w-6 h-6 text-slate-500" />
      </div>

      <h1 class="text-xl font-semibold text-slate-900 mb-2">
        {{ featureLabel }} view is not available in your workspace
      </h1>

      <p class="text-sm text-slate-600 leading-relaxed mb-6">
        Access to this area hasn't been provisioned for your workspace yet. 
        If you'd like it enabled, get in touch with your Bloom contact and 
        we'll get you set up.
      </p>

      <div class="flex items-center justify-center gap-3">
        <RouterLink 
          :to="portfolioRoute"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back to portfolio
        </RouterLink>
        <a 
          href="mailto:hello@bloom.example?subject=Workspace%20access%20request"
          class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Request access
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import LockIcon from '@/components/icons/LockIcon.vue'

const route = useRoute()
const appStore = useAppStore()

const featureLabels = {
  tickets: 'Tickets',
  sources: 'Sources',
  pipelines: 'Pipelines',
  destinations: 'Destinations',
  team: 'Team',
  billing: 'Billing',
  settings: 'Settings'
}

const featureLabel = computed(() => {
  const feature = route.query.feature || route.params.feature
  return featureLabels[feature] || 'This area'
})

const portfolioRoute = computed(() => {
  return appStore.orgXid ? `/${appStore.orgXid}/home` : '/'
})
</script>