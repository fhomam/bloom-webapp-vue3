import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/services/api'

export const useHomeStore = defineStore('home', () => {
  
  // ==========================================
  // STATE
  // ==========================================
  const pulseData = ref({
    totalAvailableInteractions: 0,
    totalAnalyzedInteractions: 0, // Consider renaming to 'Processed' in the UI!
    activeOfferingsCount: 0,
    syncingSourcesCount: 0,
    lastSyncTimestamp: null
  })
  const isPulseLoading = ref(false)

  const portfolioData = ref([])
  const isPortfolioLoading = ref(false)

  const error = ref(null)

  // ==========================================
  // ACTIONS
  // ==========================================
  async function loadPulseData(payload) {
    isPulseLoading.value = true
    error.value = null
    try {
      const res = await api.getHomePulse(payload)
      if (res) {
        pulseData.value = res
      }
    } catch (err) {
      console.error('Failed to load pulse data:', err)
      error.value = "Failed to load Organization Overview."
    } finally {
      isPulseLoading.value = false
    }
  }

  async function loadPortfolioData(payload) {
    isPortfolioLoading.value = true
    error.value = null
    try {
      // Assumes you've added getHomePortfolio to services/api.js
      const res = await api.getHomePortfolio(payload)
      console.log(res)
      if (res) {
        portfolioData.value = res
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err)
      error.value = "Failed to load Portfolio Offerings."
    } finally {
      isPortfolioLoading.value = false
    }
  }

  return { 
    // State
    pulseData, 
    isPulseLoading, 
    portfolioData,
    isPortfolioLoading,
    error, 
    
    // Actions
    loadPulseData,
    loadPortfolioData
  }
})
