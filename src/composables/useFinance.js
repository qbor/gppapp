// ===== 数据层（单例）v2.0 =====
// 双模式：guest → localStorage；user → Supabase（RLS 按 user_id 隔离）
// 覆盖：账单/分类/总预算/分类预算/账户/重复账单/债务/资料

import { reactive, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { loadLocalData, saveLocalData, clearLocalData } from '@/lib/storage'
import { EXPENSE_PRESETS, INCOME_PRESETS, genId, formatDate, formatMonth } from '@/lib/utils'
import { saveProfile as saveLocalProfile } from './useSettings'

const state = reactive({
  mode: 'guest',
  bills: [],
  categories: [],
  budgets: {},
  categoryBudgets: {},
  accounts: [],
  recurringBills: [],
  debts: [],
  loaded: false,
  loading: false
})

export const bills = computed(() => state.bills)
export const categories = computed(() => state.categories)
export const budgets = computed(() => state.budgets)
export const categoryBudgets = computed(() => state.categoryBudgets)
export const accounts = computed(() => state.accounts)
export const recurringBills = computed(() => state.recurringBills)
export const debts = computed(() => state.debts)
export const isLoaded = computed(() => state.loaded)
export const isLoading = computed(() => state.loading)
export const dataMode = computed(() => state.mode)

/** 取当前登录用户 id（登录模式 insert 必备，RLS with check 要求 user_id = auth.uid()） */
async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

// ------------------------------------------------------------------
// 初始化 / 模式切换
// ------------------------------------------------------------------

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

export function resetFinance() {
  state.bills = []
  state.categories = []
  state.budgets = {}
  state.categoryBudgets = {}
  state.accounts = []
  state.recurringBills = []
  state.debts = []
  state.loaded = false
}

async function loadFromSupabase() {
  const [billsRes, catesRes, budgetRes, catBudgetRes, accRes, recRes, debtRes, profileRes] = await Promise.all([
    supabase.from('bills').select('*').is('deleted_at', null).order('record_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('budgets').select('*'),
    supabase.from('category_budgets').select('*'),
    supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
    supabase.from('recurring_bills').select('*').order('next_date', { ascending: true }),
    supabase.from('debts').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').maybeSingle()
  ])
  ;[billsRes, catesRes, budgetRes, catBudgetRes, accRes, recRes, debtRes].forEach((r) => {
    if (r.error) throw r.error
  })

  state.bills = billsRes.data.map(normalizeBill)
  state.categories = catesRes.data
  state.budgets = toMap(budgetRes.data, 'month', 'amount')
  state.categoryBudgets = toMap(catBudgetRes.data, keyOf('month', 'category'), 'amount')
  state.accounts = accRes.data.map(normalizeAccount)
  state.recurringBills = recRes.data
  state.debts = debtRes.data

  // 兜底：注册触发器未生效时补预设分类与默认账户
  if (state.categories.length === 0) await seedSupabasePresets()
  if (state.accounts.length === 0) await seedSupabaseAccounts()

  // 同步云端资料到本机设置
  if (!profileRes.error && profileRes.data) {
    saveLocalProfile({ nickname: profileRes.data.nickname || '', avatarUrl: profileRes.data.avatar_url || '' })
  }
}

function toMap(rows, keyFn, valFn) {
  const map = {}
  rows.forEach((r) => {
    const k = typeof keyFn === 'function' ? keyFn(r) : r[keyFn]
    map[k] = Number(r[valFn])
  })
  return map
}
const keyOf = (...fields) => (r) => fields.map((f) => r[f]).join('|')

async function seedSupabasePresets() {
  const uid = await currentUserId()
  if (!uid) return
  const rows = []
  EXPENSE_PRESETS.forEach((name, i) => rows.push({ user_id: uid, name, type: 'expense', is_preset: true, sort_order: i + 1 }))
  INCOME_PRESETS.forEach((name, i) => rows.push({ user_id: uid, name, type: 'income', is_preset: true, sort_order: i + 1 }))
  const { error } = await supabase.from('categories').insert(rows)
  if (!error) state.categories = rows
}

async function seedSupabaseAccounts() {
  const uid = await currentUserId()
  if (!uid) return
  const rows = [
    { user_id: uid, name: '现金', icon: 'cash', sort_order: 1 },
    { user_id: uid, name: '微信', icon: 'wechat', sort_order: 2 },
    { user_id: uid, name: '支付宝', icon: 'alipay', sort_order: 3 },
    { user_id: uid, name: '银行卡', icon: 'card', sort_order: 4 }
  ]
  const { error } = await supabase.from('accounts').insert(rows)
  if (!error) state.accounts = rows.map(normalizeAccount)
}

function loadFromLocal() {
  const local = loadLocalData()
  state.bills = local.bills.filter((b) => !b.deleted_at).sort(sortBills)
  state.categories = local.categories
  state.budgets = local.budgets
  state.categoryBudgets = local.categoryBudgets
  state.accounts = local.accounts
  state.recurringBills = local.recurringBills
  state.debts = local.debts

  if (state.categories.length === 0) {
    state.categories = seedLocalCategories()
    persistLocal()
  }
  if (state.accounts.length === 0) {
    state.accounts = seedLocalAccounts()
    persistLocal()
  }
}

function seedLocalCategories() {
  const list = []
  EXPENSE_PRESETS.forEach((name, i) => list.push({ id: genId(), name, type: 'expense', is_preset: true, sort_order: i + 1 }))
  INCOME_PRESETS.forEach((name, i) => list.push({ id: genId(), name, type: 'income', is_preset: true, sort_order: i + 1 }))
  return list
}

function seedLocalAccounts() {
  return [
    { id: genId(), name: '现金', icon: 'cash', balance: 0, sort_order: 1 },
    { id: genId(), name: '微信', icon: 'wechat', balance: 0, sort_order: 2 },
    { id: genId(), name: '支付宝', icon: 'alipay', balance: 0, sort_order: 3 },
    { id: genId(), name: '银行卡', icon: 'card', balance: 0, sort_order: 4 }
  ]
}

function sortBills(a, b) {
  if (a.record_date !== b.record_date) return a.record_date < b.record_date ? 1 : -1
  return new Date(b.created_at) - new Date(a.created_at)
}

function normalizeBill(row) {
  return {
    ...row,
    amount: Number(row.amount),
    tags: row.tags || [],
    account: row.account || '',
    receipt: row.receipt || '',
    deleted_at: row.deleted_at || null
  }
}

function normalizeAccount(row) {
  return { ...row, balance: Number(row.balance) }
}

function persistLocal() {
  saveLocalData({
    bills: state.bills,
    categories: state.categories,
    budgets: state.budgets,
    categoryBudgets: state.categoryBudgets,
    accounts: state.accounts,
    recurringBills: state.recurringBills,
    debts: state.debts
  })
}

// ------------------------------------------------------------------
// 账户余额联动
// ------------------------------------------------------------------

/** 记账后按账户增减余额（user 模式同步云端） */
async function applyAccountDelta(accountName, type, amount) {
  if (!accountName) return
  const acc = state.accounts.find((a) => a.name === accountName)
  if (!acc) return
  const delta = type === 'expense' ? -Number(amount) : Number(amount)
  acc.balance = Number((Number(acc.balance) + delta).toFixed(2))
  if (state.mode === 'user') {
    await supabase.from('accounts').update({ balance: acc.balance }).eq('id', acc.id)
  }
}

// ------------------------------------------------------------------
// 账单操作
// ------------------------------------------------------------------

export async function addBill({ type, category, amount, note, record_date, tags = [], account = '', receipt = '' }) {
  const bill = {
    id: genId(),
    type,
    category,
    amount: Number(amount),
    note: note || '',
    record_date,
    tags,
    account,
    receipt,
    created_at: new Date().toISOString(),
    deleted_at: null
  }
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('bills')
      .insert({ user_id: uid, type, category, amount: bill.amount, note: bill.note, record_date, tags, account, receipt })
      .select()
      .single()
    if (error) throw error
    state.bills.unshift(normalizeBill(data))
    await applyAccountDelta(account, type, bill.amount)
  } else {
    state.bills.unshift(bill)
    state.bills.sort(sortBills)
    persistLocal()
    await applyAccountDelta(account, type, bill.amount)
    persistLocal()
  }
  return bill
}

export async function updateBill(id, patch) {
  if (state.mode === 'user') {
    const { data, error } = await supabase
      .from('bills')
      .update({ ...patch, amount: Number(patch.amount), tags: patch.tags || [], account: patch.account || '', receipt: patch.receipt || '' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx > -1) state.bills[idx] = normalizeBill(data)
  } else {
    const idx = state.bills.findIndex((b) => b.id === id)
    if (idx === -1) return
    state.bills[idx] = { ...state.bills[idx], ...patch, amount: Number(patch.amount), tags: patch.tags || [], account: patch.account || '', receipt: patch.receipt || '' }
    state.bills.sort(sortBills)
    persistLocal()
  }
}

/** 删除账单（软删除：标 deleted_at，可在回收站恢复） */
export async function deleteBill(id) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('bills').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  }
  const idx = state.bills.findIndex((b) => b.id === id)
  if (idx > -1) {
    state.bills[idx].deleted_at = new Date().toISOString()
    state.bills = state.bills.filter((b) => !b.deleted_at)
  }
  if (state.mode === 'guest') persistLocal()
}

/** 恢复软删除的账单（回收站用） */
export async function restoreBill(id) {
  if (state.mode === 'user') {
    const { data, error } = await supabase.from('bills').update({ deleted_at: null }).eq('id', id).select().single()
    if (error) throw error
    state.bills.unshift(normalizeBill(data))
    state.bills.sort(sortBills)
    return
  }
  const all = loadLocalData().bills
  const found = all.find((b) => b.id === id)
  if (found) {
    found.deleted_at = null
    saveLocalData({ ...loadLocalData(), bills: all })
    state.bills = all.filter((b) => !b.deleted_at).sort(sortBills)
  }
}

/** 获取回收站账单（软删除的） */
export async function fetchTrash() {
  if (state.mode === 'user') {
    const { data, error } = await supabase.from('bills').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    if (error) throw error
    return (data || []).map(normalizeBill)
  }
  return loadLocalData().bills.filter((b) => b.deleted_at)
}

/** 清空指定月份（物理删除，回收站不可恢复） */
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
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: uid, name, type, is_preset: false, sort_order: 99 })
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
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 预算操作（总预算 + 分类预算）
// ------------------------------------------------------------------

export async function setBudget(month, amount) {
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data: existing } = await supabase.from('budgets').select('id').eq('month', month).maybeSingle()
    if (existing) {
      const { error } = await supabase.from('budgets').update({ amount }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('budgets').insert({ user_id: uid, month, amount })
      if (error) throw error
    }
  }
  state.budgets = { ...state.budgets, [month]: Number(amount) }
  if (state.mode === 'guest') persistLocal()
}

/** 设置某分类某月的预算；amount<=0 表示删除该分类预算 */
export async function setCategoryBudget(month, category, amount) {
  const key = `${month}|${category}`
  const val = Number(amount)
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data: existing } = await supabase
      .from('category_budgets')
      .select('id')
      .eq('month', month)
      .eq('category', category)
      .maybeSingle()
    if (existing) {
      if (val <= 0) {
        const { error } = await supabase.from('category_budgets').delete().eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('category_budgets').update({ amount: val }).eq('id', existing.id)
        if (error) throw error
      }
    } else if (val > 0) {
      const { error } = await supabase.from('category_budgets').insert({ user_id: uid, month, category, amount: val })
      if (error) throw error
    }
  }
  const next = { ...state.categoryBudgets }
  if (val <= 0) delete next[key]
  else next[key] = val
  state.categoryBudgets = next
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 账户操作
// ------------------------------------------------------------------

export async function addAccount({ name, icon = 'other', balance = 0 }) {
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('accounts')
      .insert({ user_id: uid, name, icon, balance: Number(balance), sort_order: 99 })
      .select()
      .single()
    if (error) throw error
    state.accounts.push(normalizeAccount(data))
  } else {
    const item = { id: genId(), name, icon, balance: Number(balance), sort_order: 99 }
    state.accounts.push(item)
    persistLocal()
  }
}

/** 手动调整账户余额 */
export async function updateAccountBalance(id, balance) {
  const acc = state.accounts.find((a) => a.id === id)
  if (!acc) return
  acc.balance = Number(balance)
  if (state.mode === 'user') {
    const { error } = await supabase.from('accounts').update({ balance: acc.balance }).eq('id', id)
    if (error) throw error
  } else {
    persistLocal()
  }
}

/** 编辑账户名称/图标/余额 */
export async function updateAccount(id, { name, icon, balance }) {
  const acc = state.accounts.find((a) => a.id === id)
  if (!acc) return
  if (name !== undefined) acc.name = name
  if (icon !== undefined) acc.icon = icon
  if (balance !== undefined) acc.balance = Number(balance)
  if (state.mode === 'user') {
    const { error } = await supabase.from('accounts').update({ name: acc.name, icon: acc.icon, balance: acc.balance }).eq('id', id)
    if (error) throw error
  } else {
    persistLocal()
  }
}

export async function deleteAccount(id) {
  const acc = state.accounts.find((a) => a.id === id)
  if (state.mode === 'user') {
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error
  }
  state.accounts = state.accounts.filter((a) => a.id !== id)
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 重复账单（周期记账）
// ------------------------------------------------------------------

export async function addRecurring({ type, category, amount, note, tags = [], account = '', frequency = 'month', next_date }) {
  const item = { id: genId(), type, category, amount: Number(amount), note: note || '', tags, account, frequency, next_date, active: true, created_at: new Date().toISOString() }
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({ user_id: uid, type, category, amount: item.amount, note: item.note, tags, account, frequency, next_date })
      .select()
      .single()
    if (error) throw error
    state.recurringBills.push(data)
  } else {
    state.recurringBills.push(item)
    persistLocal()
  }
  return item
}

export async function toggleRecurring(id) {
  const item = state.recurringBills.find((r) => r.id === id)
  if (!item) return
  item.active = !item.active
  if (state.mode === 'user') {
    const { error } = await supabase.from('recurring_bills').update({ active: item.active }).eq('id', id)
    if (error) throw error
  } else {
    persistLocal()
  }
}

export async function deleteRecurring(id) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('recurring_bills').delete().eq('id', id)
    if (error) throw error
  }
  state.recurringBills = state.recurringBills.filter((r) => r.id !== id)
  if (state.mode === 'guest') persistLocal()
}

/** 到期检查：为每个到期且启用的重复账单生成一笔真实账单，并推进 next_date */
export async function checkRecurring() {
  const today = formatDate()
  const due = state.recurringBills.filter((r) => r.active && r.next_date <= today)
  for (const r of due) {
    try {
      await addBill({
        type: r.type,
        category: r.category,
        amount: r.amount,
        note: r.note,
        record_date: today,
        tags: r.tags || [],
        account: r.account || ''
      })
    } catch (e) {
      console.warn('重复账单生成失败：', e)
      continue
    }
    // 推进下次日期
    const d = new Date(r.next_date)
    if (r.frequency === 'day') d.setDate(d.getDate() + 1)
    else if (r.frequency === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    r.next_date = formatDate(d)
    if (state.mode === 'user') {
      await supabase.from('recurring_bills').update({ next_date: r.next_date }).eq('id', r.id)
    }
  }
  if (due.length > 0 && state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 债务操作
// ------------------------------------------------------------------

export async function addDebt({ direction, name, amount, note = '' }) {
  const item = { id: genId(), direction, name, amount: Number(amount), note, status: 'pending', created_at: new Date().toISOString() }
  if (state.mode === 'user') {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('debts')
      .insert({ user_id: uid, direction, name, amount: item.amount, note })
      .select()
      .single()
    if (error) throw error
    state.debts.unshift(data)
  } else {
    state.debts.unshift(item)
    persistLocal()
  }
  return item
}

/** 结清 / 重新打开 */
export async function setDebtStatus(id, status) {
  const item = state.debts.find((d) => d.id === id)
  if (!item) return
  item.status = status
  if (state.mode === 'user') {
    const { error } = await supabase.from('debts').update({ status }).eq('id', id)
    if (error) throw error
  } else {
    persistLocal()
  }
}

export async function deleteDebt(id) {
  if (state.mode === 'user') {
    const { error } = await supabase.from('debts').delete().eq('id', id)
    if (error) throw error
  }
  state.debts = state.debts.filter((d) => d.id !== id)
  if (state.mode === 'guest') persistLocal()
}

// ------------------------------------------------------------------
// 个人资料（登录用户同步云端）
// ------------------------------------------------------------------

export async function saveProfile({ nickname, avatarUrl }) {
  saveLocalProfile({ nickname, avatarUrl })
  if (state.mode === 'user') {
    const uid = await currentUserId()
    if (!uid) return
    await supabase.from('profiles').upsert({ user_id: uid, nickname: nickname || '', avatar_url: avatarUrl || '', updated_at: new Date().toISOString() })
  }
}

// ------------------------------------------------------------------
// 数据管理
// ------------------------------------------------------------------

/** 清空本机游客数据（设置页“重置”用） */
export function resetLocalData() {
  clearLocalData()
  const fresh = { bills: [], categories: seedLocalCategories(), budgets: {}, categoryBudgets: {}, accounts: seedLocalAccounts(), recurringBills: [], debts: [] }
  state.bills = fresh.bills
  state.categories = fresh.categories
  state.budgets = fresh.budgets
  state.categoryBudgets = fresh.categoryBudgets
  state.accounts = fresh.accounts
  state.recurringBills = fresh.recurringBills
  state.debts = fresh.debts
  persistLocal()
}

/** 重置全部数据：游客清本机；登录用户清云端（账单+预算+分类预算+重复+债务，账户余额清零） */
export async function resetUserData() {
  if (state.mode === 'guest') {
    resetLocalData()
    return
  }
  const tables = ['bills', 'budgets', 'category_budgets', 'recurring_bills', 'debts']
  for (const t of tables) {
    const { error } = await supabase.from(t).delete()
    if (error) throw error
  }
  const { error: accErr } = await supabase.from('accounts').update({ balance: 0 })
  if (accErr) throw accErr
  state.bills = []
  state.budgets = {}
  state.categoryBudgets = {}
  state.recurringBills = []
  state.debts = []
  state.accounts.forEach((a) => (a.balance = 0))
}

/** 备份当前全量数据（游客与登录均可导出） */
export function exportBackup() {
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    bills: state.bills,
    categories: state.categories,
    budgets: state.budgets,
    categoryBudgets: state.categoryBudgets,
    accounts: state.accounts,
    recurringBills: state.recurringBills,
    debts: state.debts
  }
}

/** 恢复备份（覆盖当前数据；登录用户先清云端再写入） */
export async function importBackup(data) {
  const d = data || {}
  if (!Array.isArray(d.bills)) throw new Error('备份文件格式不正确')
  await resetUserData()
  for (const b of d.bills || []) {
    await addBill({ type: b.type, category: b.category, amount: b.amount, note: b.note, record_date: b.record_date, tags: b.tags || [], account: b.account || '', receipt: b.receipt || '' })
  }
  for (const c of d.categories || []) {
    if (!state.categories.some((x) => x.name === c.name && x.type === c.type)) {
      await addCategory({ name: c.name, type: c.type })
    }
  }
  for (const [month, amount] of Object.entries(d.budgets || {})) {
    await setBudget(month, amount)
  }
  for (const [key, amount] of Object.entries(d.categoryBudgets || {})) {
    const [month, category] = key.split('|')
    await setCategoryBudget(month, category, amount)
  }
  for (const a of d.accounts || []) {
    if (!state.accounts.some((x) => x.name === a.name)) {
      await addAccount({ name: a.name, icon: a.icon, balance: a.balance || 0 })
    }
  }
  for (const r of d.recurringBills || []) {
    await addRecurring({ type: r.type, category: r.category, amount: r.amount, note: r.note, tags: r.tags || [], account: r.account || '', frequency: r.frequency || 'month', next_date: r.next_date || formatDate() })
  }
  for (const debt of d.debts || []) {
    await addDebt({ direction: debt.direction, name: debt.name, amount: debt.amount, note: debt.note })
    if (debt.status === 'settled') {
      const item = state.debts.find((x) => x.name === debt.name && x.amount === Number(debt.amount))
      if (item) await setDebtStatus(item.id, 'settled')
    }
  }
}
