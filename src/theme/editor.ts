import type { DeepPartial, Styles } from 'klinecharts'

export interface ThemeEditorField {
  key: string
  label: string
  type: 'color'
  defaultValue?: string
}

export interface ThemeExport {
  version: number
  name: string
  styles: DeepPartial<Styles>
  exportedAt: string
}

export function exportTheme(styles: Styles, name = 'custom-theme'): string {
  const data: ThemeExport = {
    version: 1,
    name,
    styles: styles as DeepPartial<Styles>,
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importTheme(json: string): DeepPartial<Styles> | null {
  try {
    const data = JSON.parse(json)
    if (data && typeof data === 'object' && data.version === 1 && data.styles) {
      return data.styles as DeepPartial<Styles>
    }
    return null
  } catch (e) {
    console.warn('[TradingChest] import theme failed:', e)
    return null
  }
}

export const themeEditorFields: ThemeEditorField[] = [
  { key: 'candle.bar.upColor', label: 'candle_up_color', type: 'color' },
  { key: 'candle.bar.downColor', label: 'candle_down_color', type: 'color' },
  { key: 'grid.horizontal.color', label: 'grid_horizontal_color', type: 'color' },
  { key: 'grid.vertical.color', label: 'grid_vertical_color', type: 'color' },
  { key: 'xAxis.tickText.color', label: 'xaxis_tick_color', type: 'color' },
  { key: 'yAxis.tickText.color', label: 'yaxis_tick_color', type: 'color' },
  { key: 'crosshair.horizontal.line.color', label: 'crosshair_horizontal_color', type: 'color' },
  { key: 'crosshair.vertical.line.color', label: 'crosshair_vertical_color', type: 'color' },
  { key: 'crosshair.horizontal.text.backgroundColor', label: 'crosshair_text_bg', type: 'color' },
  { key: 'crosshair.vertical.text.backgroundColor', label: 'crosshair_text_bg', type: 'color' },
]
