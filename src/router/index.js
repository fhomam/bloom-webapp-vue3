import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import BloomDashboardView from '@/views/BloomDashboardView.vue'
import HomeView from '@/views/HomeView.vue'
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
          name: 'home',
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

router.beforeEach(async (to, from, next) => {
  if (to.path === '/') {
    const appStore = useAppStore()
    try {
      await appStore.fetchSession()
      if (appStore.orgXid) {
        return next(`/${appStore.orgXid}/home`)
      }
    } catch (err) {
      console.error('Session validation failed:', err)
    }
    // If anything fails, just bounce to login
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`
    return
  }
  next()
})

export default router
