<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm animate-fade-in">
      <!-- Logo 区 -->
      <div class="mb-8 text-center">
        <img src="/logo.png" alt="快计" class="mx-auto h-16 w-16 rounded-2xl object-contain shadow-card-hover" />
        <h1 class="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">快计 · 个人财务记账</h1>
        <p class="mt-1.5 text-sm text-slate-400">记录每一笔收支，看清每一分去向</p>
      </div>

      <!-- 登录 / 注册卡片 -->
      <div class="card p-7 shadow-card-hover">
        <!-- 邮箱重置密码面板（来自邮件链接，设置新密码） -->
        <div v-if="recovery" class="space-y-4">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">设置新密码</h3>
          <p class="text-sm text-slate-400">已通过邮箱验证身份，请输入新密码完成重置。</p>
          <div>
            <label class="label" for="newpass">新密码</label>
            <input id="newpass" v-model="recoveryForm.password" type="password" class="input" placeholder="至少 6 位" autocomplete="new-password" />
          </div>
          <div>
            <label class="label" for="confirmpass">确认新密码</label>
            <input id="confirmpass" v-model="recoveryForm.confirm" type="password" class="input" placeholder="再次输入新密码" autocomplete="new-password" />
          </div>
          <button type="button" class="btn-primary w-full" :disabled="recoverySubmitting" @click="handleRecoverySubmit">
            <span>{{ recoverySubmitting ? '提交中…' : '确认重置密码' }}</span>
          </button>
        </div>

        <!-- 忘记密码面板（输入邮箱发送重置邮件） -->
        <div v-else-if="showForgot" class="space-y-4">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">找回密码</h3>
          <p class="text-sm text-slate-400">输入注册邮箱，我们将发送一封重置密码邮件，点击邮件里的链接即可设置新密码。</p>
          <div>
            <label class="label" for="forgot-email">邮箱</label>
            <input id="forgot-email" v-model.trim="forgotEmail" type="email" class="input" placeholder="you@example.com" autocomplete="email" />
          </div>
          <button type="button" class="btn-primary w-full" :disabled="forgotSubmitting" @click="handleForgotSubmit">
            <span>{{ forgotSubmitting ? '发送中…' : '发送重置邮件' }}</span>
          </button>
          <button type="button" class="w-full text-sm text-slate-400 transition-colors hover:text-slate-600" @click="closeForgot">返回登录</button>
        </div>

        <!-- 登录 / 注册主表单 -->
        <template v-else>
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

            <div v-if="mode === 'login'" class="flex justify-end">
              <button type="button" class="text-xs text-ocean-500 transition-colors hover:text-ocean-600" @click="showForgot = true">
                忘记密码？
              </button>
            </div>

            <button type="submit" class="btn-primary w-full" :disabled="submitting">
              <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
              </svg>
              <span>{{ submitting ? '请稍候…' : mode === 'login' ? '登 录' : '注 册' }}</span>
            </button>
          </form>
        </template>

        <!-- 游客入口 -->
        <div v-if="!recovery && !showForgot" class="mt-5 border-t border-slate-100 pt-4 text-center">
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
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn, signUp, resetPassword, updatePassword, isRecoverySession, signOut } from '@/composables/useAuth'
import { mergeLocalToCloud } from '@/composables/useMerge'
import { toast, errMsg } from '@/composables/useToast'

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
      // 方案B：登录成功后，把游客模式的本地数据合并到云端
      try {
        const res = await mergeLocalToCloud()
        if (res.merged > 0) toast(`已将游客模式 ${res.merged} 条本地账单合并到云端`, 'success')
      } catch {
        // 合并失败不影响登录（比如本地无数据），静默处理
      }
      router.push('/')
    } else {
      const res = await signUp(email, password)
      if (res?.session) {
        // 项目配置了邮箱验证时不会走到这里；若配置免验证则直接登录
        toast('注册成功，已自动登录', 'success')
        try {
          const m = await mergeLocalToCloud()
          if (m.merged > 0) toast(`已将游客模式 ${m.merged} 条本地账单合并到云端`, 'success')
        } catch {
          // 静默
        }
        router.push('/')
      } else {
        // 邮箱验证开启：注册成功但未登录，需去邮箱确认
        toast('注册成功，请前往邮箱完成身份验证后再登录', 'success')
        mode.value = 'login'
        form.password = ''
        form.confirm = ''
      }
    }
  } catch (e) {
    const msg = e?.message || ''
    // Supabase 常见错误提示友好化；其余一律显示通用文案，不暴露内部细节
    if (msg.includes('Invalid login credentials')) toast('邮箱或密码错误', 'error')
    else if (msg.includes('already registered') || msg.includes('already exists')) toast('该邮箱已注册，请直接登录', 'error')
    else if (msg.includes('Email not Confirmed') || msg.includes('confirm')) toast('请先前往邮箱完成验证后再登录', 'error')
    else if (msg.includes('rate limit') || msg.includes('too many')) toast('操作过于频繁，请稍后再试', 'error')
    else toast(errMsg(e, '登录或注册失败，请稍后重试'), 'error')
  } finally {
    submitting.value = false
  }
}

// ---- 忘记密码：发送重置邮件 ----
const showForgot = ref(false)
const forgotEmail = ref('')
const forgotSubmitting = ref(false)

function closeForgot() {
  showForgot.value = false
  forgotEmail.value = ''
}

async function handleForgotSubmit() {
  const email = forgotEmail.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('请输入有效的邮箱地址', 'error')
    return
  }
  forgotSubmitting.value = true
  try {
    await resetPassword(email)
    toast('重置邮件已发送，请前往邮箱点击链接完成重置', 'success')
    closeForgot()
  } catch (e) {
    const msg = e?.message || ''
    if (msg.includes('rate limit') || msg.includes('too many')) toast('操作过于频繁，请稍后再试', 'error')
    else if (msg.includes('Email not confirmed') || msg.includes('confirm')) toast('该邮箱尚未验证，请先完成邮箱验证', 'error')
    else toast(errMsg(e, '发送失败，请稍后重试'), 'error')
  } finally {
    forgotSubmitting.value = false
  }
}

// ---- 邮箱链接返回：设置新密码（recovery 会话）----
const recovery = ref(false)
const recoveryForm = reactive({ password: '', confirm: '' })
const recoverySubmitting = ref(false)

onMounted(() => {
  if (isRecoverySession()) {
    recovery.value = true
    // 清除 URL 中的令牌参数，避免刷新页面重复触发
    history.replaceState({}, '', window.location.pathname + window.location.search)
  }
})

async function handleRecoverySubmit() {
  const pwd = recoveryForm.password
  if (pwd.length < 6) {
    toast('新密码至少 6 位', 'error')
    return
  }
  if (pwd !== recoveryForm.confirm) {
    toast('两次输入的新密码不一致', 'error')
    return
  }
  recoverySubmitting.value = true
  try {
    await updatePassword(pwd)
    await signOut()
    toast('密码已重置，请用新密码重新登录', 'success')
    recovery.value = false
    mode.value = 'login'
    recoveryForm.password = ''
    recoveryForm.confirm = ''
  } catch (e) {
    toast(errMsg(e, '重置失败，请稍后重试'), 'error')
  } finally {
    recoverySubmitting.value = false
  }
}
</script>
