<template>
  <!-- 移动端底部标签栏：仅 < lg 显示，固定底部 -->
  <nav
    class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
  >
    <RouterLink
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors"
      :class="route.path === item.path ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
        <path :d="item.icon" />
      </svg>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { path: '/', label: '总览', icon: 'M3 3v18h18 M3 12h18 M3 9h6l3 3 3-6 3 3' },
  { path: '/record', label: '记账', icon: 'M12 5v14 M5 12h14' },
  { path: '/transactions', label: '明细', icon: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01' },
  { path: '/debts', label: '债务', icon: 'M16 3h5v5 M21 3l-7 7 M8 3H3v5 M3 3l7 7' },
  { path: '/settings', label: '设置', icon: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6' }
]
</script>
