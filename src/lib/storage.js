// ===== 游客模式本地存储层（localStorage）=====
// 未登录状态下，账单/分类/预算/账户/标签/重复账单/债务等数据全部保存在用户当前设备上。

const STORAGE_KEY = 'finance_app_guest_v2'

/** 本地数据结构 */
function emptyData() {
  return {
    bills: [], // { id,type,category,amount,note,record_date,created_at,tags:[],account,receipt,deleted_at }
    categories: [],
    budgets: {}, // { 'YYYY-MM': 金额 }
    categoryBudgets: {}, // { 'YYYY-MM|分类': 金额 }
    accounts: [], // { id,name,icon,balance,sort_order }
    recurringBills: [], // { id,type,category,amount,note,tags,account,frequency,next_date,active }
    debts: [], // { id,direction,name,amount,note,status }
    settings: { theme: 'light', currencySymbol: '¥', nickname: '', avatarUrl: '' }
  }
}

/** 读取本地数据；不存在或损坏时返回空结构 */
export function loadLocalData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw)
    return {
      bills: Array.isArray(parsed.bills) ? parsed.bills : [],
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {},
      categoryBudgets: parsed.categoryBudgets && typeof parsed.categoryBudgets === 'object' ? parsed.categoryBudgets : {},
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      recurringBills: Array.isArray(parsed.recurringBills) ? parsed.recurringBills : [],
      debts: Array.isArray(parsed.debts) ? parsed.debts : [],
      settings: parsed.settings && typeof parsed.settings === 'object' ? { ...emptyData().settings, ...parsed.settings } : emptyData().settings
    }
  } catch {
    return emptyData()
  }
}

/** 保存本地数据 */
export function saveLocalData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('本地数据保存失败：', e)
  }
}

/** 清空本地数据 */
export function clearLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
