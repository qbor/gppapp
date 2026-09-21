<template>
  <!-- 独立页（登录/注册）：无侧边栏 -->
  <div v-if="route.meta.public" class="min-h-screen bg-gradient-to-br from-brand-50 via-ocean-50 to-slate-50">
    <RouterView />
    <ToastContainer />
  </div>

  <!-- 核心页面 -->
  <div v-else class="min-h-screen">
    <div class="flex">
      <!-- 桌面端：左侧固定导航（< lg 隐藏） -->
      <AppSidebar />

      <main class="flex-1 min-w-0">
        <!-- 移动端顶部栏（仅 < lg 显示） -->
        <AppHeader />

        <!-- 游客模式提示条 -->
        <div
          v-if="!isLoggedIn"
          class="flex items-center justify-center gap-2 bg-ocean-500/95 px-3 py-2 text-xs text-white sm:text-sm lg:px-4 lg:py-2"
        >
          <span class="hidden sm:inline">游客模式：数据仅保存在当前设备，注册登录后可与云端同步</span>
          <span class="sm:hidden">游客模式 · 数据存本机</span>
          <RouterLink
            to="/login"
            class="shrink-0 rounded-lg bg-white/20 px-2.5 py-0.5 font-medium transition-colors hover:bg-white/30"
          >
            登录 / 注册
          </RouterLink>
        </div>

        <div class="mx-auto max-w-6xl px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

    <!-- 移动端底部标签栏（仅 < lg 显示） -->
    <AppTabbar />
    <ToastContainer />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppTabbar from '@/components/AppTabbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { isLoggedIn } from '@/composables/useAuth'

const route = useRoute()
</script>

<style scoped>
/* 页面切换过渡 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
