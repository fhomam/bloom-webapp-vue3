import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Left Nav State
  const isLeftCollapsed = ref(true)

  // Right Sidebar State
  const isRightOpen = ref(false)
  const rightTabs = ref([]) 
  const activeRightTab = ref('')
  
  // Track the dynamic height of the top ribbon
  const reportRibbonHeight = ref(0)

  // The "Magic" function pages will call to configure the sidebar
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

  // --- Centralized Navigation Orchestrator ---
  function navigateWithGrace(tabId, newParams, route, router) {
    // 1. Instantly switch the UI tab
    activeRightTab.value = tabId
    isRightOpen.value = true
    
    // 2. Grant the browser 50ms of computational grace
    setTimeout(() => {
      const newQuery = { ...route.query }
      
      // 3. Apply new params and delete any passed as null/undefined
      Object.keys(newParams).forEach(key => {
        if (newParams[key] === null || newParams[key] === undefined) {
          delete newQuery[key]
        } else {
          newQuery[key] = newParams[key]
        }
      })

      // Auto-cleanup mutually exclusive interaction params
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
    configureRightSidebar, 
    closeRightSidebar,
    navigateWithGrace // <-- Exported here so components can use it!
  }
})