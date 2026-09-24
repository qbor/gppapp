// ===== 全局设置（主题 / 货币 / 昵称 / 头像），localStorage 持久化 =====
import { reactive, computed } from 'vue'
import { loadLocalData, saveLocalData } from '@/lib/storage'
import { setCurrencySymbol } from '@/lib/utils'

const state = reactive({
  theme: 'light', // 'light' | 'dark'
  currencySymbol: '¥',
  nickname: '',
  avatarUrl: ''
})

export const theme = computed(() => state.theme)
export const currencySymbol = computed(() => state.currencySymbol)
export const nickname = computed(() => state.nickname)
export const avatarUrl = computed(() => state.avatarUrl)

/** 启动时从本地读取设置（游客模式与登录模式共用本机设置） */
export function initSettings() {
  const local = loadLocalData()
  state.theme = local.settings?.theme === 'dark' ? 'dark' : 'light'
  state.currencySymbol = local.settings?.currencySymbol || '¥'
  state.nickname = local.settings?.nickname || ''
  state.avatarUrl = local.settings?.avatarUrl || ''
  setCurrencySymbol(state.currencySymbol)
  applyTheme()
}

function persist() {
  const local = loadLocalData()
  local.settings = {
    theme: state.theme,
    currencySymbol: state.currencySymbol,
    nickname: state.nickname,
    avatarUrl: state.avatarUrl
  }
  saveLocalData(local)
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', state.theme === 'dark')
}

/** 切换明暗主题 */
export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  applyTheme()
  persist()
}

/** 修改货币符号 */
export function setCurrency(symbol) {
  state.currencySymbol = symbol || '¥'
  setCurrencySymbol(state.currencySymbol)
  persist()
}

/** 保存昵称/头像（游客与登录共用本机；登录用户由 useFinance.saveProfile 额外同步云端） */
export function saveProfile({ nickname: n, avatarUrl: a }) {
  if (n !== undefined) state.nickname = n
  if (a !== undefined) state.avatarUrl = a
  persist()
}

/** 头像首字符（无头像时用昵称首字/默认） */
export const displayName = computed(() => state.nickname || 'U')
