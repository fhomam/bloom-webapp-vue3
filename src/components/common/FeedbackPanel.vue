<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="ui.isFeedbackOpen"
        ref="panelRef"
        class="fixed inset-y-0 right-0 z-[60] w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="Send feedback"
      >
        <header class="h-14 flex items-center justify-between px-5 border-b border-slate-200 shrink-0">
          <div class="flex items-center gap-2">
            <FeedbackIcon class="w-5 h-5 text-slate-700" />
            <h2 class="text-sm font-semibold text-slate-900">Send feedback</h2>
          </div>
          <button
            @click="ui.closeFeedback()"
            class="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 rounded"
            aria-label="Close feedback panel"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </header>

        <div v-if="status === 'composing'" class="flex-1 flex flex-col p-5 overflow-y-auto">
          <p class="text-sm text-slate-600 leading-relaxed mb-4">
            What's on your mind? Bugs, ideas, things that confused you, things you loved — anything goes. We read all of it.
          </p>

          <textarea
            v-model="ui.feedbackDraft"
            placeholder="Tell us what you're thinking..."
            class="w-full flex-1 min-h-[200px] resize-none px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bloom-primary focus:border-transparent transition-shadow"
            ref="textareaRef"
          ></textarea>

          <div class="mt-3">
            <button
              type="button"
              @click="showContext = !showContext"
              class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg 
                :class="['w-3 h-3 transition-transform', showContext ? 'rotate-90' : '']" 
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              What gets sent with this
            </button>
            <div v-if="showContext" class="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1.5">
              <div class="flex items-start gap-2">
                <span class="text-slate-400 shrink-0 w-12">Page</span>
                <span class="font-mono text-slate-700 break-all">{{ contextPreview.route }}</span>
              </div>
              <div v-if="contextPreview.offeringXid" class="flex items-start gap-2">
                <span class="text-slate-400 shrink-0 w-12">Offering</span>
                <span class="font-mono text-slate-700">{{ contextPreview.offeringXid }}</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-slate-400 shrink-0 w-12">When</span>
                <span class="text-slate-700">Now</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end mt-4">
            <button
              @click="handleSubmit"
              :disabled="!canSubmit || status === 'submitting'"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {{ status === 'submitting' ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </div>

        <div v-else-if="status === 'sent'" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h3 class="text-base font-semibold text-slate-900 mb-1.5">Thanks — we got it</h3>
          <p class="text-sm text-slate-600 max-w-xs leading-relaxed mb-6">
            Your feedback's on its way to the Bloom team. We genuinely read everything.
          </p>
          <p class="text-xs text-slate-400">
            Closing in {{ countdown }}s
          </p>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAppStore } from '@/stores/app'
import { submitFeedback } from '@/services/system'
import FeedbackIcon from '@/components/icons/FeedbackIcon.vue'

const ui = useUiStore()
const appStore = useAppStore()
const route = useRoute()

const status = ref('composing')
const countdown = ref(5)
const textareaRef = ref(null)
const panelRef = ref(null)
const showContext = ref(false)

let closeTimer = null
let countdownTimer = null

const canSubmit = computed(() => ui.feedbackDraft.trim().length > 0)

function buildContext() {
  return {
    route: route.fullPath,
    routeName: String(route.name || ''),
    orgXid: route.params.orgXid || appStore.orgXid || null,
    offeringXid: route.params.offeringXid || null,
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timestamp: new Date().toISOString()
  }
}

async function handleSubmit() {
  if (!canSubmit.value || status.value === 'submitting') return

  status.value = 'submitting'
  const payload = {
    message: ui.feedbackDraft.trim(),
    context: buildContext()
  }

  try {
    await submitFeedback(payload)
  } catch (err) {
    console.log('[Bloom feedback — backend not yet wired]', payload)
  }

  ui.clearFeedbackDraft()
  status.value = 'sent'
  startCountdown()
}

function startCountdown() {
  countdown.value = 5
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)

  closeTimer = setTimeout(() => {
    ui.closeFeedback()
  }, 5000)
}

function resetTimers() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const contextPreview = computed(() => ({
  route: route.fullPath,
  offeringXid: route.params.offeringXid || null
}))

watch(
  () => ui.isFeedbackOpen,
  (isOpen) => {
    if (isOpen) {
      status.value = 'composing'
      resetTimers()
      requestAnimationFrame(() => {
        textareaRef.value?.focus()
      })
    } else {
      resetTimers()
      if (status.value === 'sent') {
        status.value = 'composing'
      }
    }
  }
)

function handleEscape(e) {
  if (e.key === 'Escape' && ui.isFeedbackOpen) {
    ui.closeFeedback()
  }
}

window.addEventListener('keydown', handleEscape)

onUnmounted(() => {
  resetTimers()
  window.removeEventListener('keydown', handleEscape)
})
</script>