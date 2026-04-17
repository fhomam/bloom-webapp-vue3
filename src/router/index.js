import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import BloomDashboardView from '@/views/BloomDashboardView.vue'
import BloomReportView from '@/views/BloomReportView.vue'
import HomeView from '@/views/HomeView.vue'

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

export default router
