import type { Chart, KLineData, Nullable } from 'klinecharts'
import { downloadUrl } from '../core/download'

/**
 * 数据导出工具
 */

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function generateCsv(dataList: readonly KLineData[], from: number, to: number): string {
  const lines = new Array<string>(to - from + 2)
  lines[0] = 'Date,Open,High,Low,Close,Volume'
  for (let i = from; i <= to; i++) {
    const d = dataList[i]
    const date = Number.isFinite(d.timestamp) ? new Date(d.timestamp).toISOString() : ''
    lines[i - from + 1] = [
      date,
      csvEscape(d.open),
      csvEscape(d.high),
      csvEscape(d.low),
      csvEscape(d.close),
      d.volume == null ? '' : csvEscape(d.volume),
    ].join(',')
  }
  return lines.join('\n')
}

function downloadCsv(csv: string, filename: string): void {
  const BOM = '﻿'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  URL.revokeObjectURL(url)
}

/**
 * 导出可见区间数据为 CSV
 */
export function exportToCSV(chart: Nullable<Chart>, filename?: string): boolean {
  try {
    if (!chart) return false

    const dataList = chart.getDataList()
    if (!dataList || dataList.length === 0) return false

    const visibleRange = chart.getVisibleRange()
    const from = Math.max(0, visibleRange.from)
    const to = Math.min(dataList.length - 1, visibleRange.to)

    downloadCsv(
      generateCsv(dataList, from, to),
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
      generateCsv(dataList, 0, dataList.length - 1),
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

    downloadUrl(
      url,
      filename ??
        `chart-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`,
    )
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
    return true
  } catch {
    return false
  }
}
