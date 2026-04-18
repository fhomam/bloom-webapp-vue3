import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Left Nav State
  const isLeftCollapsed = ref(true)

  // Right Sidebar State
  const isRightOpen = ref(false)
  const rightTabs = ref([]) 
  const activeRightTab = ref('')
  
  const reportRibbonHeight = ref(0)

  // --- NEW: Global Navigation Memory ---
  // Remembers the last specific app views so the sidebar always works from Home
  const lastDashboardRoute = ref(null)
  const lastReportRoute = ref(null)

  function configureRightSidebar(tabs, defaultTab, autoOpen = false) {
    rightTabs.value = tabs
    activeRightTab.value = defaultTab
    if (autoOpen) {
      isRightOpen.value = true
    }
  }

  function closeRightSidebar() {
    isRightOpen.value = false
  }

  function navigateWithGrace(tabId, newParams, route, router) {
    activeRightTab.value = tabId
    isRightOpen.value = true
    
    setTimeout(() => {
      const newQuery = { ...route.query }
      
      Object.keys(newParams).forEach(key => {
        if (newParams[key] === null || newParams[key] === undefined) {
          delete newQuery[key]
        } else {
          newQuery[key] = newParams[key]
        }
      })

      if (newParams.exploreIssue) delete newQuery.exploreEmotion
      if (newParams.exploreEmotion) delete newQuery.exploreIssue
      
      router.push({ query: newQuery })
    }, 300) 
  }

  return { 
    isLeftCollapsed, 
    isRightOpen, 
    rightTabs, 
    activeRightTab, 
    reportRibbonHeight,
    lastDashboardRoute, // <-- Exported
    lastReportRoute,    // <-- Exported
    configureRightSidebar, 
    closeRightSidebar,
    navigateWithGrace
  }
})
