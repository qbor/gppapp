import { reactive, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { loadLocalData, saveLocalData, clearLocalData } from '@/lib/storage'
import { EXPENSE_PRESETS, INCOME_PRESETS, genId, formatDate, formatMonth } from '@/lib/utils'


// 加这一行：取当前登录用户 id
const currentUserId = async () => (await supabase.auth.getUser()).data.user?.id

// ===== 数据层（单例）=====
// 支持双模式：
//   guest：所有数据保存在本机 localStorage
//   user ：数据保存在 Supabase（RLS 按 user_id 隔离）
const state = reactive({
  mode: 'guest', // 'guest' | 'user'
  bills: [], // 账单，按 record_date desc 排序
  categories: [], // 收支分类
  budgets: {}, // { 'YYYY-MM': 金额 }
  loaded: false, // 是否已完成首次加载
  loading: false // 是否正在请求
})

export const bills = computed(() => state.bills)
export const categories = computed(() => state.categories)
export const budgets = computed(() => state.budgets)
export const isLoaded = computed(() => state.loaded)
export const isLoading = computed(() => state.loading)
export const dataMode = computed(() => state.mode)

// ------------------------------------------------------------------
// 模式切换与数据加载
// ------------------------------------------------------------------

/** 根据模式初始化/重新加载数据 */
export async function initFinance(mode) {
  state.mode = mode
  state.loading = true
  try {
    if (mode === 'user') {
      await loadFromSupabase()
    } else {
      loadFromLocal()
    }
  } finally {
    state.loading = false
    state.loaded = true
  }
}

/** 清空内存态（登出兜底用） */
export function resetFinance() {
  state.bills = []
  state.categories = []
  state.budgets = {}
  state.loaded = false
}

async function loadFromSupabase() {
  const [billsRes, catesRes, budgetRes] = await Promise.all([
    supabase.from('bills').select('*').order('record_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('budgets').select('*')
  ])
  if (billsRes.error) throw billsRes.error
  if (catesRes.error) throw catesRes.error
  if (budgetRes.error) throw budgetRes.error

  state.bills = billsRes.data.map(normalizeBill)
  state.categories = catesRes.data
  const budgetsMap = {}
  budgetRes.data.forEach((b) => { budgetsMap[b.month] = Number(b.amount) })
  state.budgets = budgetsMap

  // 兜底：若注册触发器未生效导致无分类，则写入预设分类
  if (state.categories.length === 0) {
    await seedSupabasePresets()
  }
}

/** 为登录用户写入预设分类（注册触发器缺失时的兜底） */
async function seedSupabasePresets() {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return
  const rows = []
  EXPENSE_PRESETS.forEach((name, i) => rows.push({ user_id: user.user.id, name, type: 'expense', is_preset: true, sort_order: i + 1 }))
  INCOME_PRESETS.forEach((name, i) => rows.push({ user_id: user.user.id, name, type: 'income', is_preset: true, sort_order: i + 1 }))
  const { error } = await supabase.from('categories').insert(rows)
  if (!error) state.categories = rows
}

function loadFromLocal() {
  const local = loadLocalData()
  state.bills = local.bills.sort(sortBills)
  state.categories = local.categories
  state.budgets = local.budgets

  // 首次使用游客模式：写入预设分类
  if (state.categories.length === 0) {
    state.categories = seedLocalCategories()
    persistLocal()
  }
}

function seedLocalCategories() {
  const list = []
  EXPENSE_PRESETS.forEach((name, i) => list.push({ id: genId(), name, type: 'expense', is_preset: true, sort_order: i + 1 }))
  INCOME_PRESETS.forEach((name, i) => list.push({ id: genId(), name, type: 'income', is_preset: true, sort_order: i + 1 }))
  return list
}

function sortBills(a, b) {
  if (a.record_date !== b.record_date) return a.record_date < b.record_date ? 1 : -1
  return new Date(b.created_at) - new Date(a.created_at)
}

/** 将 Supabase 行规整为前端账单结构（numeric 转 Number） */
function normalizeBill(row) {
  return { ...row, amount: Number(row.amount) }
}

// ------------------------------------------------------------------
// 账单操作
// ------------------------------------------------------------------

export async function addBill({ type, category, amount, note, record_date }) {
  const bill = { id: genId(), type, category, amount: Number(amount), note: note || '', record_date, created_at: new Date().toISOString() }
  if (state.mode === 'user') {
    const { data, error } = await supabase
      .from('bills')
      .insert({ user_id: await currentUserId(), type, category, amount: bill.amount, note: bill.note, record_date })
      .select()
      .single()
    if (error) throw error
    state.bills.unshift(normalizeBill(data))
  } else {
    state.bills.unshift(bill)
    state.bills.sort(sortBills)
    persistLocal()
  }
  return bill
}

export async function updateBill(id, patch) {
  if (state.mode === 'user') {
    const { data, error } = await supabase
      .from('bills')
      .update({ ...patch, amount: Number(patch.amount) })
      .eq('id', id)
      .eq('user_id', await currentUserId())
      .select()
      .single()
    if (error) throw error
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx > -1) state.bills[idx] = normalizeBill(data)
  } else {
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx === -1) return
    state.bills[idx] = { ...state.bills[idx], ...patch, amount: Number(patch.amount) }
    state.bills.sort(sortBills)
    persistLocal()
  }
}

export async function deleteBill(id) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('bills').delete().eq('id', id).eq('user_id', await currentUserId())
    if (error) throw error
  } 
  state.bills = state.bills.filter((b) => b.id !== id)
  if (state.mode === 'guest')persistLocal()
}

/** 清空指定月份（当月或任意月）的账单 */
export async function clearMonthBills(month) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('bills').delete().like('record_date', `${month}-%`)
    if (error) throw error
  }
  state.bills = state.bills.filter((b) => !b.record_date.startsWith(`${month}-`))
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 分类操作
// ------------------------------------------------------------------

export async function addCategory({ name, type }) {
  if (state.mode === 'user') {
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: await currentUserId(),name, type, is_preset: false, sort_order: 99 })
      .select()
      .single()
    if (error) throw error
    state.categories.push(data)
  } else {
    const item = { id: genId(), name, type, is_preset: false, sort_order: 99 }
    state.categories.push(item)
    persistLocal()
  }
}

export async function updateCategory(id, name) {
  if (state.mode === 'user') {
    const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single()
    if (error) throw error
    const idx = state.categories.findIndex((c) => c.id === id)
    if (idx > -1) state.categories[idx] = data
  } else {
    const idx = state.categories.findIndex((c) => c.id === id)
    if (idx > -1) state.categories[idx].name = name
    persistLocal()
  }
}

export async function deleteCategory(id) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  } 
  state.categories = state.categories.filter((c) => c.id !== id)
  if (state.mode === 'guest')persistLocal()
}

// ------------------------------------------------------------------
// 预算操作
// ------------------------------------------------------------------

export async function setBudget(month, amount) {
  if (state.mode === 'user') {
    const { data: existing } = await supabase.from('budgets').select('id').eq('month', month).maybeSingle()
    if (existing) {
      const { error } = await supabase.from('budgets').update({ amount }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('budgets').insert({ user_id: await currentUserId(),month, amount })
      if (error) throw error
    }
  }
  state.budgets = { ...state.budgets, [month]: Number(amount) }
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 本地持久化
// ------------------------------------------------------------------

function persistLocal() {
  saveLocalData({
    bills: state.bills,
    categories: state.categories,
    budgets: state.budgets
  })
}

/** 清空本机游客数据（设置页“重置”用） */
export function resetLocalData() {
  clearLocalData()
  state.bills = []
  state.categories = seedLocalCategories()
  state.budgets = {}
  persistLocal()
}

/** 重置全部数据：游客清本机，登录用户清云端（账单 + 预算，分类保留） */
export async function resetUserData() {
  if (state.mode === 'guest') {
    resetLocalData()
    return
  }
  // RLS 下 delete 仅作用于当前用户自己的行
  const { error: billErr } = await supabase.from('bills').delete().eq('user_id', await currentUserId())
  if (billErr) throw billErr
  const { error: budgetErr } = await supabase.from('budgets').delete().eq('user_id', await currentUserId())
  if (budgetErr) throw budgetErr
  state.bills = []
  state.budgets = {}
}
