import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Left Nav State
  const isLeftCollapsed = ref(true)

  // Right Sidebar State
  const isRightOpen = ref(false)
  const rightTabs = ref([]) 
  const activeRightTab = ref('')
  
  // NEW: Track the dynamic height of the top ribbon
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

  return { 
    isLeftCollapsed, 
    isRightOpen, 
    rightTabs, 
    activeRightTab, 
    reportRibbonHeight,
    configureRightSidebar, 
    closeRightSidebar 
  }
})
