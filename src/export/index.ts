import type { Chart, Nullable } from 'klinecharts'

/**
 * 数据导出工具
 */

interface CsvRow {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function generateCsv(rows: CsvRow[]): string {
  const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
  const lines: string[] = [headers.map(csvEscape).join(',')]
  for (const d of rows) {
    const date = Number.isFinite(d.timestamp) ? new Date(d.timestamp).toISOString() : ''
    const cells = [
      date,
      csvEscape(d.open),
      csvEscape(d.high),
      csvEscape(d.low),
      csvEscape(d.close),
      d.volume == null ? '' : csvEscape(d.volume),
    ]
    lines.push(cells.join(','))
  }
  return lines.join('\n')
}

function downloadCsv(csv: string, filename: string): void {
  const BOM = '﻿'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出可见区间数据为 CSV
 */
export function exportToCSV(chart: Nullable<Chart>, filename?: string): boolean {
  try {
    if (!chart) return false

    const dataList = chart.getDataList()
    const visibleRange = chart.getVisibleRange()

    if (!dataList || dataList.length === 0) return false

    const startIdx = Math.max(0, visibleRange.from)
    const endIdx = Math.min(dataList.length - 1, visibleRange.to)

    const rows: CsvRow[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      rows.push(dataList[i])
    }

    downloadCsv(
      generateCsv(rows),
      filename ?? `chart-data-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    return true
  } catch {
    /* c8 ignore next 2 */
    return false
  }
}

/**
 * 导出全部数据为 CSV
 */
export function exportAllToCSV(chart: Nullable<Chart>, filename?: string): boolean {
  try {
    if (!chart) return false

    const dataList = chart.getDataList()
    if (!dataList || dataList.length === 0) return false

    downloadCsv(
      generateCsv(dataList),
      filename ?? `chart-data-full-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    return true
  } catch {
    /* c8 ignore next 2 */
    return false
  }
}

/**
 * 导出图表截图
 */
export function exportScreenshot(
  chart: Nullable<Chart>,
  options?: {
    includeOverlay?: boolean
    format?: 'png' | 'jpeg'
    backgroundColor?: string
    filename?: string
  },
): boolean {
  try {
    if (!chart) return false

    const { includeOverlay = true, format = 'png', backgroundColor, filename } = options ?? {}

    const url = chart.getConvertPictureUrl(includeOverlay, format, backgroundColor)

    const link = document.createElement('a')
    link.href = url
    link.download =
      filename ??
      `chart-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
    return true
  } catch {
    return false
  }
}
