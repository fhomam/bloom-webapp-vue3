import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import BloomDashboardView from '@/views/BloomDashboardView.vue'
// Note: You imported BloomReportView at the top, but also used an inline import() in the routes. 
// It's best to stick to just one method (usually inline for lazy loading).
import HomeView from '@/views/HomeView.vue'

// Import your store (Make sure this path is correct!)
import { useAppStore } from '@/stores/app'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/:orgXid/home',
          name: 'home', // or 'Home' to match your AppLayout checks
          component: HomeView
        },
        {
          path: '/:orgXid/dashboard/:offeringType/:offeringXid/:periodType/:periodId',
          name: 'BloomDashboard',
          component: BloomDashboardView
        },
        {
          path: '/:orgXid/reports/:offeringType/:offeringXid/:periodType/:periodId',
          name: 'BloomReport',
          component: () => import('@/views/BloomReportView.vue')
        }
      ]
    },
  ]
})

// --- Global Navigation Guard ---
router.beforeEach(async (to, from, next) => {
  // If the user lands exactly on the root URL
  if (to.path === '/') {
    // Note: We initialize the store *inside* the guard to ensure Pinia is fully loaded
    const appStore = useAppStore()
    
    try {
      // Ensure we have the session loaded to grab the orgXid
      await appStore.fetchSession()
      
      if (appStore.orgXid) {
        // We have the ID, send them to their portfolio basecamp!
        return next(`/${appStore.orgXid}/home`)
      } else {
        // Edge case: Valid session but no orgXid? Send them to auth.
        window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`
        return
      }
    } catch (err) {
      // If fetching the session fails (e.g., they aren't logged in)
      console.error('Session validation failed on root navigation:', err)
      window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`
      return
    }
  }

  // For all other routes, let them through (for now!)
  next()
})

export default router