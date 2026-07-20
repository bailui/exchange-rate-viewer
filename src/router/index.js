import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/exchange-rate',
    children: [
      {
        path: 'exchange-rate',
        name: 'ExchangeRate',
        component: () => import('../views/ExchangeRate.vue'),
        meta: { title: '实时汇率', icon: 'Money' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
