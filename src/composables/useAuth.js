import { reactive, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { initFinance, resetFinance, checkRecurring } from './useFinance'
import { initSettings } from './useSettings'

// ===== 认证状态（单例）=====
// mode: 'user'  → 已登录，数据走 Supabase（RLS 隔离）
// mode: 'guest' → 未登录 / 未配置 Supabase，数据存本机
const state = reactive({
  user: null,
  initialized: false
})

export const isLoggedIn = computed(() => Boolean(state.user))

export const userEmail = computed(() => state.user?.email ?? '')

export const mode = computed(() => (state.user ? 'user' : 'guest'))

/**
 * 应用启动时初始化：
 * 1. 读取本机设置（主题/货币）
 * 2. 未配置 Supabase → 直接进入游客模式
 * 3. 已配置 → 恢复会话（刷新页面不丢失登录态），并监听登录态变化
 */
export async function initAuth() {
  if (state.initialized) return
  state.initialized = true

  initSettings()

  if (!isSupabaseConfigured) {
    await initFinance('guest')
    await checkRecurring()
    return
  }

  const { data } = await supabase.auth.getSession()
  state.user = data?.session?.user ?? null
  await initFinance(state.user ? 'user' : 'guest')
  await checkRecurring()

  // 登录 / 登出 / 令牌刷新时同步应用状态
  supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user ?? null
    await initFinance(state.user ? 'user' : 'guest')
    await checkRecurring()
  })
}

/** 邮箱注册 */
export async function signUp(email, password) {
  if (!isSupabaseConfigured) throw new Error('尚未配置 Supabase，请先填写 .env 环境变量')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin + '/login' }
  })
  if (error) throw error
  return data
}

/** 邮箱登录 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured) throw new Error('尚未配置 Supabase，请先填写 .env 环境变量')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** 发送密码重置邮件 */
export async function resetPassword(email) {
  if (!isSupabaseConfigured) throw new Error('尚未配置 Supabase，请先填写 .env 环境变量')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login'
  })
  if (error) throw error
}

/** 重置密码流程：通过邮箱链接进入 recovery 会话后，设置新密码 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** 当前是否处于"邮箱重置密码链接"跳转回来的 recovery 会话（URL hash 含 type=recovery） */
export function isRecoverySession() {
  return window.location.hash.includes('type=recovery')
}

/** 退出登录（回到游客模式） */
export async function signOut() {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  // onAuthStateChange 会自动把模式切回 guest；未配置时兜底
  if (!isSupabaseConfigured) {
    resetFinance()
    await initFinance('guest')
  }
}
