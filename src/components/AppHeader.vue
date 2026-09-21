<template>
  <!-- 移动端顶部栏：仅 < lg 显示 -->
  <header class="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
    <!-- <RouterLink to="/" class="flex items-center gap-2">
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h3" />
        </svg>
      </span>
      <span class="text-base font-semibold text-slate-800">快计</span>
    </RouterLink> -->

    <RouterLink to="/" class="flex items-center gap-2.5">
      <img src="/logo.png" alt="Logo" class="h-9 w-9 rounded-xl object-cover" />
      <span class="text-base font-semibold text-slate-800">轻账</span>
    </RouterLink>



    <div v-if="isLoggedIn" class="flex items-center gap-2">
      <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
        {{ emailInitial }}
      </span>
      <button class="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:text-rose-500" @click="handleLogout">
        退出
      </button>
    </div>
    <RouterLink v-else to="/login" class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600">
      登录 / 注册
    </RouterLink>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { isLoggedIn, signOut, userEmail } from '@/composables/useAuth'
import { toast } from '@/composables/useToast'

const router = useRouter()
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
