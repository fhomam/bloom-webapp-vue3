import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import BloomReportView from '@/views/BloomReportView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: DashboardView
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
