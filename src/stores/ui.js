import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const FEEDBACK_DRAFT_KEY = 'bloom.feedback.draft'

function loadDraft() {
  try {
    return localStorage.getItem(FEEDBACK_DRAFT_KEY) || ''
  } catch {
    return ''
  }
}

function saveDraft(value) {
  try {
    if (value) {
      localStorage.setItem(FEEDBACK_DRAFT_KEY, value)
    } else {
      localStorage.removeItem(FEEDBACK_DRAFT_KEY)
    }
  } catch {
    // localStorage unavailable; silently degrade
  }
}

export const useUiStore = defineStore('ui', () => {
  const isLeftCollapsed = ref(true)

  const isRightOpen = ref(false)
  const rightTabs = ref([])
  const activeRightTab = ref('')
  const reportRibbonHeight = ref(0)

  const lastDashboardRoute = ref(null)
  const lastReportRoute = ref(null)

  const isFeedbackOpen = ref(false)
  const feedbackDraft = ref(loadDraft())

  watch(feedbackDraft, (val) => {
    saveDraft(val)
  })

  function configureRightSidebar(tabs, defaultTab, autoOpen = false) {
    rightTabs.value = tabs
    activeRightTab.value = defaultTab
    if (autoOpen) {
      isRightOpen.value = true
    }
  }

  function toggleFeedback() {
    isFeedbackOpen.value = !isFeedbackOpen.value
  }

  function openFeedback() {
    isFeedbackOpen.value = true
  }

  function closeFeedback() {
    isFeedbackOpen.value = false
  }

  function clearFeedbackDraft() {
    feedbackDraft.value = ''
  }

  return {
    isLeftCollapsed,
    isRightOpen,
    rightTabs,
    activeRightTab,
    reportRibbonHeight,
    lastDashboardRoute,
    lastReportRoute,
    configureRightSidebar,
    isFeedbackOpen,
    feedbackDraft,
    toggleFeedback,
    openFeedback,
    closeFeedback,
    clearFeedbackDraft
  }
})