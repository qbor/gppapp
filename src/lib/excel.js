// ===== Excel 工具：导出 / 导入（SheetJS xlsx）=====
import * as XLSX from 'xlsx'

/**
 * 下载 Excel 文件（表头 + 数据行 → .xlsx）
 * @param {string} filename 文件名（建议 .xlsx 结尾）
 * @param {string[]} headers 表头
 * @param {any[][]} rows 数据行（与表头顺序对应）
 */
export function downloadExcelFile(filename, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '账单')
  XLSX.writeFile(wb, filename)
}

/**
 * 读取 Excel 文件为二维数组（第一行是表头）
 * 兼容 .xlsx / .xls，取第一个工作表
 */
export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(reader.result), { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) : []
        resolve(rows)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
