import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth'

export const useAppStore = defineStore('auth', () => {
  const session = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const inFlightCount = ref(0)
  const isGlobalLoading = computed(() => inFlightCount.value > 0)

  const orgXid = computed(() => session.value?.orgXid || '')
  const principalSid = computed(() => session.value?.principalSid || '')

  async function fetchSession() {
    // If we already have the session skip loading it again
    if (session.value) return session.value

    isLoading.value = true
    error.value = null
    
    try {
      const response = await authService.getSession()
      if (response?.status === 'success' && response?.value) {
        session.value = response.value
      } else {
        throw new Error("Invalid session format received.")
      }
    } catch (err) {
      console.error("Failed to fetch session:", err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
    
    return session.value
  }

  function startLoading() {
    inFlightCount.value += 1
  }

  function stopLoading() {
    inFlightCount.value = Math.max(0, inFlightCount.value - 1)
  }

  return { 
    session, 
    isLoading, 
    error, 
    orgXid, 
    principalSid, 
    fetchSession,
    inFlightCount,
    isGlobalLoading,
    startLoading,
    stopLoading
  }
})