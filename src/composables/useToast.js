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

export function dismiss(id) {
  const idx = state.list.findIndex((t) => t.id === id)
  if (idx > -1) state.list.splice(idx, 1)
}

export function useToast() {
  return { toasts: state.list, toast, dismiss }
}
