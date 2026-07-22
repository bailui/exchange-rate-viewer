import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'
import { updateSeo } from '../seo'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/exchange-rate',
    children: [
      { path: 'exchange-rate', name: 'ExchangeRate', component: () => import('../views/ExchangeRate.vue') },
      { path: 'calculator', name: 'Calculator', component: () => import('../views/CalculatorPage.vue') },
      { path: 'alerts', name: 'Alerts', component: () => import('../views/AlertsPage.vue') },
      { path: 'trends', name: 'Trends', component: () => import('../views/TrendsPage.vue') }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })
router.afterEach((to) => updateSeo(to.path))

export default router
