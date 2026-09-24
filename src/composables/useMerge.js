// ===== 游客数据 → 云端合并（登录成功后调用）=====
import { supabase } from '@/lib/supabase'
import { loadLocalData, clearLocalData } from '@/lib/storage'

/**
 * 将游客模式的本机数据合并进云端：
 * 1. 读本地账单（未软删的）
 * 2. 与云端账单按「日期+金额+类型+分类+备注」去重，跳过已存在的
 * 3. 缺失的批量写入 bills（带 user_id，RLS 自动归属当前用户）
 * 4. 合并完成后清空本地数据
 * 返回 { merged: 合并条数, skipped: 跳过条数 }
 */
export async function mergeLocalToCloud() {
  const local = loadLocalData()
  const localBills = (local.bills || []).filter((b) => !b.deleted_at)
  if (localBills.length === 0) {
    clearLocalData()
    return { merged: 0, skipped: 0 }
  }

  const { data: cloudRows, error } = await supabase.from('bills').select('record_date, amount, type, category, note').is('deleted_at', null)
  if (error) throw error

  const cloudKeys = new Set((cloudRows || []).map((r) => `${r.record_date}|${r.amount}|${r.type}|${r.category}|${r.note || ''}`))

  const { data: user } = await supabase.auth.getUser()
  const uid = user?.user?.id
  if (!uid) throw new Error('登录状态已失效，请重新登录')

  const toInsert = []
  let skipped = 0
  localBills.forEach((b) => {
    const key = `${b.record_date}|${b.amount}|${b.type}|${b.category}|${b.note || ''}`
    if (cloudKeys.has(key)) {
      skipped++
      return
    }
    toInsert.push({
      user_id: uid,
      type: b.type,
      category: b.category,
      amount: Number(b.amount),
      note: b.note || '',
      record_date: b.record_date,
      tags: b.tags || [],
      account: b.account || '',
      receipt: b.receipt || ''
    })
  })

  let merged = 0
  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from('bills').insert(toInsert)
    if (insErr) throw insErr
    merged = toInsert.length
  }

  clearLocalData()
  return { merged, skipped }
}
