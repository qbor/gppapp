<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm animate-fade-in">
      <!-- Logo 区 -->
      <div class="mb-8 text-center">
        <img src="/logo.png" alt="快计" class="mx-auto h-16 w-16 rounded-2xl object-contain shadow-card-hover" />
        <h1 class="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">快计 · 个人财务记账</h1>
        <p class="mt-1.5 text-sm text-slate-400">记录每一笔收支，看清每一分去向</p>
      </div>

      <!-- 登录卡片 -->
      <div class="card p-7 shadow-card-hover">
        <!-- 模式切换 -->
        <div class="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            class="rounded-lg py-2 text-sm font-medium transition-all duration-200"
            :class="mode === 'login' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'login'"
          >
            登录
          </button>
          <button
            class="rounded-lg py-2 text-sm font-medium transition-all duration-200"
            :class="mode === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="mode = 'register'"
          >
            注册
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="label" for="email">邮箱</label>
            <input id="email" v-model.trim="form.email" type="email" class="input" placeholder="you@example.com" autocomplete="email" />
          </div>

          <div>
            <label class="label" for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              :placeholder="mode === 'register' ? '至少 6 位' : '请输入密码'"
              autocomplete="current-password"
            />
          </div>

          <div v-if="mode === 'register'">
            <label class="label" for="confirm">确认密码</label>
            <input id="confirm" v-model="form.confirm" type="password" class="input" placeholder="再次输入密码" autocomplete="new-password" />
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="submitting">
            <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
            </svg>
            <span>{{ submitting ? '请稍候…' : mode === 'login' ? '登 录' : '注 册' }}</span>
          </button>
        </form>

        <!-- 游客入口 -->
        <div class="mt-5 border-t border-slate-100 pt-4 text-center">
          <p class="text-xs text-slate-400">不想注册？</p>
          <RouterLink to="/" class="mt-1 inline-block text-sm font-medium text-ocean-500 transition-colors hover:text-ocean-600">
            以游客身份体验（数据保存在本机）
          </RouterLink>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-slate-300">数据由 Supabase 安全存储 · RLS 权限隔离</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp } from '@/composables/useAuth'
import { mergeLocalToCloud } from '@/composables/useMerge'
import { toast } from '@/composables/useToast'

const router = useRouter()
const mode = ref('login')
const submitting = ref(false)

const form = reactive({ email: '', password: '', confirm: '' })

async function handleSubmit() {
  const email = form.email.trim()
  const password = form.password

  // 校验
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('请输入有效的邮箱地址', 'error')
    return
  }
  if (password.length < 6) {
    toast('密码至少 6 位', 'error')
    return
  }
  if (mode.value === 'register' && password !== form.confirm) {
    toast('两次输入的密码不一致', 'error')
    return
  }

  submitting.value = true
  try {
    if (mode.value === 'login') {
      await signIn(email, password)
      toast('登录成功，欢迎回来', 'success')
    } else {
      await signUp(email, password)
      toast('注册成功，已自动登录', 'success')
    }
    // 方案B：登录成功后，把游客模式的本地数据合并到云端
    try {
      const res = await mergeLocalToCloud()
      if (res.merged > 0) toast(`已将游客模式 ${res.merged} 条本地账单合并到云端`, 'success')
    } catch {
      // 合并失败不影响登录（比如本地无数据），静默处理
    }
    router.push('/')
  } catch (e) {
    const msg = e?.message || '操作失败，请重试'
    // Supabase 常见错误提示友好化
    if (msg.includes('Invalid login credentials')) toast('邮箱或密码错误', 'error')
    else if (msg.includes('already registered') || msg.includes('already exists')) toast('该邮箱已注册，请直接登录', 'error')
    else if (msg.includes('not configured')) toast(msg, 'error')
    else toast(msg, 'error')
  } finally {
    submitting.value = false
  }
}
</script>
