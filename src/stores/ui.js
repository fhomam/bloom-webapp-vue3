import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Left Nav State
  const isLeftCollapsed = ref(true)

  // Right Sidebar State
  // Note: these refs are written exclusively by BloomReportView's
  // syncSidebarFromUrl() — driven by the panel URL param. Don't mutate
  // them directly from components; use the useBloomUrlState composable
  // to update the URL and let the sync watcher follow.
  const isRightOpen = ref(false)
  const rightTabs = ref([])
  const activeRightTab = ref('')

  const reportRibbonHeight = ref(0)

  // Global Navigation Memory — remembers last specific app views
  // so the sidebar always works from Home.
  const lastDashboardRoute = ref(null)
  const lastReportRoute = ref(null)

  function configureRightSidebar(tabs, defaultTab, autoOpen = false) {
    rightTabs.value = tabs
    activeRightTab.value = defaultTab
    if (autoOpen) {
      isRightOpen.value = true
    }
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
  }
})