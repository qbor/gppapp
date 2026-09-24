import { createRouter, createWebHistory } from 'vue-router'

// 路由配置：登录/注册为独立页面，其余为核心功能页
// 游客模式下核心页面同样开放（数据保存在本机），登录后数据与账号绑定
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '数据总览' }
  },
  {
    path: '/record',
    name: 'record',
    component: () => import('@/views/RecordView.vue'),
    meta: { title: '记一笔' }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/views/TransactionsView.vue'),
    meta: { title: '账单明细' }
  },
  {
    path: '/debts',
    name: 'debts',
    component: () => import('@/views/DebtView.vue'),
    meta: { title: '债务' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} · 快计` : '快计 · 个人财务记账'
})

export default router
