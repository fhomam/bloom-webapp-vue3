<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isVisible"
      class="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-30"
      aria-hidden="true"
    >
      <div class="loading-bar-segment"></div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const isVisible = ref(false)

const SHOW_DELAY_MS = 150
const MIN_VISIBLE_MS = 400

let showTimer = null
let hideTimer = null
let shownAt = null

function clearTimers() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null }
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

function scheduleShow() {
  if (isVisible.value || showTimer) return
  showTimer = setTimeout(() => {
    isVisible.value = true
    shownAt = Date.now()
    showTimer = null
  }, SHOW_DELAY_MS)
}

function scheduleHide() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
    return
  }

  if (!isVisible.value) return

  const elapsed = Date.now() - (shownAt || 0)
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

  if (hideTimer) return

  hideTimer = setTimeout(() => {
    isVisible.value = false
    shownAt = null
    hideTimer = null
  }, remaining)
}

watch(
  () => appStore.isGlobalLoading,
  (loading) => {
    if (loading) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
      scheduleShow()
    } else {
      scheduleHide()
    }
  },
  { immediate: true }
)

onUnmounted(clearTimers)
</script>

<style scoped>
.loading-bar-segment {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 40%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-bloom-primary, #9A3356) 50%,
    transparent 100%
  );
  animation: loading-marquee 1.2s ease-in-out infinite;
}

@keyframes loading-marquee {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
</style>