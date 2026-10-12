import { reactive } from 'vue'

// ===== 轻量全局提示（Toast）=====
const state = reactive({
  list: [] // { id, type: 'success' | 'error' | 'info', message }
})

let seed = 0

export function toast(message, type = 'info') {
  const id = ++seed
  state.list.push({ id, type, message })
  setTimeout(() => dismiss(id), 2600)
  return id
}

/**
 * 把异常转成面向用户的友好提示文案。
 * - 业务代码主动抛出的错误（中文文案）→ 直接展示；
 * - 系统/网络/数据库等技术性错误（英文或堆栈信息）→ 统一替换为通用文案，
 *   避免向用户暴露内部实现细节。
 */
export function errMsg(err, fallback = '操作失败，请稍后重试') {
  if (!err) return fallback
  const msg = err?.message || ''
  if (typeof msg !== 'string' || !msg.trim()) return fallback
  // 业务错误特征：我们主动抛出的中文提示，或带有业务标记
  if (err.isBiz || /[\u4e00-\u9fa5]/.test(msg)) return msg
  return fallback
}

export function dismiss(id) {
  const idx = state.list.findIndex((t) => t.id === id)
  if (idx > -1) state.list.splice(idx, 1)
}

export function useToast() {
  return { toasts: state.list, toast, dismiss }
}
