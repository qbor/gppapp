// ===== 一句话记账解析（规则版，无需外部 AI）=====
// 输入："今天吃饭花了50" → { type:'expense', amount:50, category:'餐饮', note:'吃饭' }

/** 关键词 → 分类映射（按顺序匹配，先命中先得） */
const CATEGORY_RULES = [
  { category: '餐饮', keywords: ['吃饭', '饭', '早餐', '早', '午餐', '午', '晚餐', '晚', '外卖', '奶茶', '咖啡', '夜宵', '餐', '吃'] },
  { category: '交通', keywords: ['地铁', '公交', '打车', '滴滴', '出租', '高铁', '火车', '机票', '加油', '停车', '通勤'] },
  { category: '购物', keywords: ['淘宝', '京东', '拼多多', '买', '购物', '衣服', '鞋', '包', '化妆品', '快递'] },
  { category: '房租', keywords: ['房租', '租金', '月租'] },
  { category: '水电', keywords: ['水电', '电费', '水费', '燃气', '煤气', '物业'] },
  { category: '娱乐', keywords: ['电影', '游戏', '唱歌', 'KTV', '旅游', '门票', '会员', '视频'] },
  { category: '工资', keywords: ['工资', '薪水', '薪资', '发薪'] },
  { category: '奖金', keywords: ['奖金', '年终奖', '分红'] },
  { category: '兼职', keywords: ['兼职', '外快', '零工'] }
]

/** 收入关键词（命中则视为收入） */
const INCOME_WORDS = ['工资', '奖金', '兼职', '外快', '收入', '报销', '分红', '赚']

/**
 * 解析一句话为账单信息
 * @returns {{ ok:boolean, type, amount, category, note, error? }}
 */
export function parseBillText(text) {
  const src = String(text || '').trim()
  if (!src) return { ok: false, error: '请输入记账内容' }

  // 1. 提取金额：第一个数字（支持 12.5 / 12.50 / 12元5角 简化为小数）
  const amountMatch = src.match(/(\d+(?:\.\d{1,2})?)/)
  if (!amountMatch) return { ok: false, error: '没找到金额，请带上数字，如：吃饭花了50' }
  const amount = Number(amountMatch[1])
  if (amount <= 0) return { ok: false, error: '金额必须大于 0' }

  // 2. 判断收支类型（默认支出）
  const isIncome = INCOME_WORDS.some((w) => src.includes(w))
  const type = isIncome ? 'income' : 'expense'

  // 3. 匹配分类
  let category = ''
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => src.includes(k))) {
      category = rule.category
      break
    }
  }
  if (!category) category = type === 'income' ? '其他' : '其他'

  // 4. 备注 = 去掉金额后的原文（截断 30 字）
  const note = src.replace(amountMatch[0], '').replace(/花了|用了|付了|消费|支出|赚了|收入/g, '').trim().slice(0, 30)

  return { ok: true, type, amount, category, note: note || '' }
}
