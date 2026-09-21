// ===== 游客模式本地存储层（localStorage）=====
// 未登录状态下，账单/分类/预算数据全部保存在用户当前设备上。

const STORAGE_KEY = 'finance_app_guest_v1'

/** 本地数据结构：{ bills: [], categories: [], budgets: { 'YYYY-MM': 金额 } } */
function emptyData() {
  return { bills: [], categories: [], budgets: {} }
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
      budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : {}
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
    // 存储空间不足或隐私模式等场景，静默失败由上层提示
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
