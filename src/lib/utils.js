// ===== 常量与工具函数 =====

/** 系统预设支出分类 */
export const EXPENSE_PRESETS = ['餐饮', '交通', '购物', '房租', '水电', '娱乐', '其他']

/** 系统预设收入分类 */
export const INCOME_PRESETS = ['工资', '奖金', '兼职', '其他']

/** 收支类型文案 */
export const TYPE_LABEL = { expense: '支出', income: '收入' }

/** 收支类型对应颜色（Tailwind 完整类名，保证可被扫描编译） */
export const TYPE_COLOR = {
  expense: {
    text: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-400'
  },
  income: {
    text: 'text-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    dot: 'bg-brand-400'
  }
}

/** 将日期对象格式化为 YYYY-MM */
export function formatMonth(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** 将日期对象格式化为 YYYY-MM-DD */
export function formatDate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 金额格式化：千分位 + 两位小数 */
export function fmtMoney(value) {
  const num = Number(value || 0)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 金额输入合法性校验：非空、非负数、合法数字 */
export function validateAmount(amount) {
  const str = String(amount ?? '').trim()
  if (str === '') return '金额不能为空'
  const num = Number(str)
  if (!Number.isFinite(num)) return '金额格式不正确'
  if (num <= 0) return '金额必须大于 0'
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return '金额最多保留两位小数'
  return ''
}

/** 生成唯一 ID（兼容现代浏览器） */
export function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
