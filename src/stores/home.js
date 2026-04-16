import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/services/api'

export const useHomeStore = defineStore('home', () => {
  
  // --- STATE ---
  const pulseData = ref({
    totalAvailableInteractions: 0,
    totalAnalyzedInteractions: 0,
    activeOfferingsCount: 0,
    syncingSourcesCount: 0,
    lastSyncTimestamp: null
  })
  const isPulseLoading = ref(false)

  const portfolioData = ref([])
  const isPortfolioLoading = ref(false)

  // 🔥 New Trending Issues State
  const trendingIssuesData = ref([])
  const isTrendingLoading = ref(false)

  const error = ref(null)

  // --- ACTIONS ---
  async function loadPulseData(payload) {
    isPulseLoading.value = true
    error.value = null
    try {
      const res = await api.getHomePulse(payload)
      if (res) pulseData.value = res
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
      const res = await api.getHomePortfolio(payload)
      if (res) portfolioData.value = res
    } catch (err) {
      console.error('Failed to load portfolio data:', err)
      error.value = "Failed to load Portfolio Offerings."
    } finally {
      isPortfolioLoading.value = false
    }
  }

  // 🔥 New Trending Issues Action
  async function loadTrendingIssues(payload) {
    isTrendingLoading.value = true
    error.value = null
    try {
      // Pass days: 7 along with orgXid
      const res = await api.getHomeTrendingIssues({ ...payload, days: 7 })
      if (res) trendingIssuesData.value = res
    } catch (err) {
      console.error('Failed to load trending issues:', err)
      error.value = "Failed to load Trending Issues."
    } finally {
      isTrendingLoading.value = false
    }
  }

  return { 
    pulseData, isPulseLoading, 
    portfolioData, isPortfolioLoading,
    trendingIssuesData, isTrendingLoading, // Exposed state
    error, 
    loadPulseData, loadPortfolioData, loadTrendingIssues // Exposed actions
  }
})
