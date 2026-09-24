<template>
  <!-- 移动端顶部栏：仅 < lg 显示 -->
  <header class="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
    <RouterLink to="/" class="flex items-center gap-2">
      <img src="/logo.png" alt="快计" class="h-8 w-8 rounded-lg object-contain shadow-card" />
      <span class="text-base font-semibold text-slate-800 dark:text-slate-100">快计</span>
    </RouterLink>

    <div v-if="isLoggedIn" class="flex items-center gap-2">
      <RouterLink to="/settings">
        <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="h-7 w-7 rounded-full object-cover" />
        <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {{ displayName.slice(0, 1) }}
        </span>
      </RouterLink>
      <button class="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:text-rose-500 dark:text-slate-400" @click="handleLogout">
        退出
      </button>
    </div>
    <RouterLink v-else to="/login" class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600">
      登录 / 注册
    </RouterLink>
  </header>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { isLoggedIn, signOut } from '@/composables/useAuth'
import { displayName, avatarUrl } from '@/composables/useSettings'
import { toast } from '@/composables/useToast'

const router = useRouter()

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
