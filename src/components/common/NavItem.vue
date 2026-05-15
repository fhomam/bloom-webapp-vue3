<template>
  <RouterLink 
    :to="resolvedRoute"
    :class="[
      'group flex items-center p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative',
      isActive ? 'bg-slate-800 text-white' : '',
      isLocked && !isActive ? 'text-slate-500' : '',
      isCollapsed ? 'justify-center' : ''
    ]"
  >
    <div class="relative shrink-0">
      <component :is="icon" class="w-5 h-5" />
      <span 
        v-if="isLocked && isCollapsed"
        class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-950 flex items-center justify-center"
        aria-label="Locked"
      >
        <LockIcon class="w-2.5 h-2.5 text-slate-400" />
      </span>
    </div>

    <span 
      :class="[
        'ml-3 whitespace-nowrap font-medium text-sm transition-opacity duration-300 flex-1',
        isCollapsed ? 'opacity-0 hidden md:hidden' : 'opacity-100'
      ]"
    >
      {{ label }}
    </span>

    <LockIcon 
      v-if="isLocked && !isCollapsed" 
      class="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-slate-400 transition-colors"
    />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LockIcon from '@/components/icons/LockIcon.vue'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: [Object, Function], required: true },
  route: { type: [String, Object, Function], required: true },
  match: { type: Array, default: () => [] },
  locked: { type: Boolean, default: false },
  feature: { type: String, default: '' },
  isCollapsed: { type: Boolean, default: false },
  lockedRoute: { type: [String, Object], default: '' }
})

const route = useRoute()

const isActive = computed(() => {
  if (props.locked && props.feature && route.name === 'AccessDenied') {
    return route.query.feature === props.feature
  }
  if (!route.name) return false
  return props.match.includes(String(route.name))
})

const isLocked = computed(() => props.locked)

const resolvedRoute = computed(() => {
  if (props.locked) {
    const base = typeof props.lockedRoute === 'string' ? { path: props.lockedRoute } : props.lockedRoute
    return { ...base, query: { feature: props.feature } }
  }
  return typeof props.route === 'function' ? props.route() : props.route
})
</script>