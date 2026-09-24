// ===== CSV 工具：导出 / 导入 =====

/** 转义单个 CSV 字段（含逗号/引号/换行时加引号） */
function escapeField(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * 生成 CSV 文本
 * @param {string[]} headers 表头
 * @param {any[][]} rows 数据行（与表头顺序对应）
 */
export function buildCSV(headers, rows) {
  const lines = [headers.map(escapeField).join(',')]
  rows.forEach((row) => lines.push(row.map(escapeField).join(',')))
  return '\uFEFF' + lines.join('\r\n') // BOM 让 Excel 正确识别中文
}

/** 下载文本文件 */
export function downloadTextFile(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 下载 JSON 文件（备份用） */
export function downloadJsonFile(filename, data) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json')
}

/**
 * 解析 CSV 文本为二维数组
 * 支持：带引号字段、字段内逗号/换行、转义引号
 */
export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const src = String(text || '').replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      // 跳过空行
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row)
  return rows
}

/** 读文件为文本（file input 用） */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

/** 读文件为 JSON */
export function readFileAsJson(file) {
  return readFileAsText(file).then((t) => JSON.parse(t))
}
