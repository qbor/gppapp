// ===== 统计纯函数：时间维度 / 年度汇总 / 排行榜 / 对比 =====
import { rangeOf, rangeLabel, shiftAnchor, filterByDateRange } from '@/lib/utils'

/** 按粒度过滤账单 */
export function billsInRange(bills, granularity, anchor) {
  const [start, end] = rangeOf(granularity, anchor)
  return { list: filterByDateRange(bills, start, end), start, end }
}

export { rangeOf, rangeLabel, shiftAnchor }

/** 收支合计 */
export function sumByType(list, type) {
  return list.filter((b) => b.type === type).reduce((s, b) => s + Number(b.amount || 0), 0)
}

/** 某月收支合计 */
export function monthStats(bills, month) {
  const list = bills.filter((b) => b.record_date.startsWith(month))
  return {
    income: sumByType(list, 'income'),
    expense: sumByType(list, 'expense'),
    balance: sumByType(list, 'income') - sumByType(list, 'expense'),
    count: list.length
  }
}

/** 年度汇总：全年收入/支出/结余 + 12 个月小卡片 */
export function annualSummary(bills, year) {
  const prefix = String(year)
  const yearBills = bills.filter((b) => b.record_date.startsWith(prefix))
  const months = []
  for (let m = 1; m <= 12; m++) {
    const key = `${prefix}-${String(m).padStart(2, '0')}`
    months.push({ month: key, label: `${m}月`, ...monthStats(yearBills, key) })
  }
  return {
    income: sumByType(yearBills, 'income'),
    expense: sumByType(yearBills, 'expense'),
    balance: sumByType(yearBills, 'income') - sumByType(yearBills, 'expense'),
    count: yearBills.length,
    months
  }
}

/** 分类排行（某区间）：按分类聚合金额，降序 */
export function topCategories(bills, type, topN = 5) {
  const map = {}
  bills.filter((b) => b.type === type).forEach((b) => {
    map[b.category] = (map[b.category] || 0) + Number(b.amount || 0)
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN)
}

/** 账单金额排行（支出最大 TopN） */
export function topExpenseBills(bills, topN = 5) {
  return bills
    .filter((b) => b.type === 'expense')
    .slice()
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, topN)
}

/** 两个月收支对比 */
export function compareMonths(bills, m1, m2) {
  const a = monthStats(bills, m1)
  const b = monthStats(bills, m2)
  return {
    m1: { month: m1, ...a },
    m2: { month: m2, ...b },
    diff: {
      income: b.income - a.income,
      expense: b.expense - a.expense,
      balance: b.balance - a.balance
    }
  }
}

/** 全部标签（去重，用于筛选下拉） */
export function allTags(bills) {
  const set = new Set()
  bills.forEach((b) => (b.tags || []).forEach((t) => set.add(t)))
  return [...set].sort()
}
