// ===== 常量与工具函数 =====

/** 系统预设支出分类 */
export const EXPENSE_PRESETS = ['餐饮', '交通', '购物', '房租', '水电', '娱乐', '其他']

/** 系统预设收入分类 */
export const INCOME_PRESETS = ['工资', '奖金', '兼职', '其他']

/** 收支类型文案 */
export const TYPE_LABEL = { expense: '支出', income: '收入' }

/** 收支类型对应颜色（Tailwind 完整类名，保证可被扫描编译） */
export const TYPE_COLOR = {
  expense: { text: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-400' },
  income: { text: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200', dot: 'bg-brand-400' }
}

/** 账户图标映射（前端展示用） */
export const ACCOUNT_ICONS = {
  cash: '💵',
  wechat: '💬',
  alipay: '🅰️',
  card: '💳',
  other: '💰'
}

// ---- 货币符号（全局模块级，可由 useSettings 切换）----
let currencySymbol = '¥'
export function setCurrencySymbol(symbol) {
  currencySymbol = symbol || '¥'
}
export function getCurrencySymbol() {
  return currencySymbol
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

/** 金额格式化：千分位 + 两位小数（不含货币符号，符号由模板/调用方添加） */
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

// ---- 时间维度工具 ----

/** 计算某粒度下 anchor 日期所属区间的起止日期，返回 [start, end]（含端点，YYYY-MM-DD） */
export function rangeOf(granularity, anchor = new Date()) {
  const d = new Date(anchor)
  const fmt = (x) => formatDate(x)
  if (granularity === 'day') {
    return [fmt(d), fmt(d)]
  }
  if (granularity === 'week') {
    const day = d.getDay() // 0=周日
    const diff = day === 0 ? -6 : 1 - day // 周一为一周开始
    const start = new Date(d)
    start.setDate(d.getDate() + diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return [fmt(start), fmt(end)]
  }
  if (granularity === 'month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return [fmt(start), fmt(end)]
  }
  if (granularity === 'quarter') {
    const q = Math.floor(d.getMonth() / 3)
    const start = new Date(d.getFullYear(), q * 3, 1)
    const end = new Date(d.getFullYear(), q * 3 + 3, 0)
    return [fmt(start), fmt(end)]
  }
  // year
  const start = new Date(d.getFullYear(), 0, 1)
  const end = new Date(d.getFullYear(), 11, 31)
  return [fmt(start), fmt(end)]
}

/** 按区间过滤账单（bills 需带 record_date 字段） */
export function filterByDateRange(bills, start, end) {
  return bills.filter((b) => b.record_date >= start && b.record_date <= end)
}

/** 某粒度的展示文案：周→"本周/下周"，月→"2026-09" 等 */
export function rangeLabel(granularity, anchor = new Date()) {
  const d = new Date(anchor)
  if (granularity === 'day') return formatDate(d)
  if (granularity === 'week') {
    const [s, e] = rangeOf('week', d)
    return `${s.slice(5)} ~ ${e.slice(5)}`
  }
  if (granularity === 'month') return formatMonth(d)
  if (granularity === 'quarter') {
    const q = Math.floor(d.getMonth() / 3) + 1
    return `${d.getFullYear()}年Q${q}`
  }
  return `${d.getFullYear()}年`
}

/** 把日期往前/往后推移若干“粒度单位”（用于上一期/下一期） */
export function shiftAnchor(granularity, anchor = new Date(), delta) {
  const d = new Date(anchor)
  if (granularity === 'day') d.setDate(d.getDate() + delta)
  else if (granularity === 'week') d.setDate(d.getDate() + delta * 7)
  else if (granularity === 'month') d.setMonth(d.getMonth() + delta)
  else if (granularity === 'quarter') d.setMonth(d.getMonth() + delta * 3)
  else d.setFullYear(d.getFullYear() + delta)
  return d
}

/** 把图片文件压缩为小尺寸 dataURL（凭证上传用），返回 Promise<string> */
export function compressImageToDataUrl(file, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
