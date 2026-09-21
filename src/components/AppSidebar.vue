<template>
  <!-- 桌面端左侧固定导航：< lg 尺寸下隐藏（移动端使用底部标签栏） -->
  <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
    <!-- Logo -->
    <RouterLink to="/" class="flex items-center gap-2.5 px-6 py-6">
      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h3" />
        </svg>
      </span>
      <span class="text-lg font-semibold tracking-wide text-slate-800">快计</span>
    </RouterLink>

    <!-- 导航 -->
    <nav class="flex-1 space-y-1 px-3">
      <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item" :class="{ 'nav-item-active': route.path === item.path }">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
          <path :d="item.icon" />
        </svg>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- 用户区 -->
    <div class="border-t border-slate-100 p-4">
      <template v-if="isLoggedIn">
        <div class="flex items-center gap-3 rounded-xl px-2 py-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {{ emailInitial }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700">{{ userEmail }}</p>
            <p class="text-xs text-slate-400">云端同步中</p>
          </div>
        </div>
        <button class="mt-1 w-full rounded-xl px-2 py-2 text-left text-sm text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600" @click="handleLogout">
          退出登录
        </button>
      </template>
      <template v-else>
        <div class="flex items-center gap-3 rounded-xl px-2 py-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700">游客</p>
            <p class="text-xs text-slate-400">数据存本机</p>
          </div>
        </div>
        <RouterLink to="/login" class="btn-primary mt-1 w-full">
          登录 / 注册
        </RouterLink>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { isLoggedIn, signOut, userEmail } from '@/composables/useAuth'
import { toast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: '数据总览', icon: 'M3 3v18h18 M3 12h18 M3 9h6l3 3 3-6 3 3' },
  { path: '/record', label: '记一笔', icon: 'M12 5v14 M5 12h14' },
  { path: '/transactions', label: '账单明细', icon: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01' },
  { path: '/settings', label: '分类与预算', icon: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6' }
]

const emailInitial = computed(() => (userEmail.value || 'U').charAt(0).toUpperCase())

async function handleLogout() {
  try {
    await signOut()
    toast('已退出登录，当前为游客模式', 'success')
    router.push('/')
  } catch (e) {
    toast(e.message || '退出失败，请重试', 'error')
  }
}
</script>
