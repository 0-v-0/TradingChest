import type { Styles, DeepPartial } from 'klinecharts'

/**
 * 图表布局持久化
 * 将指标、绘图、设置保存到 localStorage
 */

export interface ChartLayout {
  version: number
  timestamp: number
  theme: string
  locale: string
  timezone: string
  mainIndicators: string[]
  subIndicators: string[]
  styles: DeepPartial<Styles> | null
  overlayData: OverlaySerializedData[]
}

export interface OverlaySerializedData {
  name: string
  groupId: string
  points: Array<{ timestamp: number; value: number }>
  lock: boolean
  visible: boolean
  extendData?: Record<string, unknown>
}

const STORAGE_KEY_PREFIX = 'trading-chest-layout-'
const CURRENT_VERSION = 1

/**
 * 保存布局。返回 true 表示成功，false 表示失败（如 localStorage 已满）。
 */
export function saveLayout(
  key: string,
  layout: Omit<ChartLayout, 'version' | 'timestamp'>,
): boolean {
  const data: ChartLayout = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    ...layout,
  }
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data))
    return true
  } catch (e) {
    if (e instanceof Error && e.name !== 'QuotaExceededError') {
      console.warn('[TradingChest] save layout failed:', e)
    }
    return false
  }
}

/**
 * 加载布局。返回 null 表示不存在、版本不匹配或数据损坏。
 */
export function loadLayout(key: string): ChartLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, unknown>
    if (typeof data.version !== 'number') return null
    if (typeof data.timestamp !== 'number') return null
    if (typeof data.theme !== 'string') return null
    if (typeof data.locale !== 'string') return null
    if (typeof data.timezone !== 'string') return null
    if (!Array.isArray(data.mainIndicators) || !data.mainIndicators.every((v: unknown) => typeof v === 'string')) return null
    if (!Array.isArray(data.subIndicators) || !data.subIndicators.every((v: unknown) => typeof v === 'string')) return null
    if (data.styles !== null && typeof data.styles !== 'object') return null
    if (!Array.isArray(data.overlayData)) return null
    const migrated = migrateLayout(data)
    return migrated
  } catch (e) {
    console.warn('[TradingChest] load layout failed:', e)
    return null
  }
}

/**
 * 删除布局
 */
export function deleteLayout(key: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + key)
}

/**
 * 列出所有已保存的布局
 */
export function listLayouts(): Array<{ key: string; timestamp: number }> {
  const result: Array<{ key: string; timestamp: number }> = []
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i)
    if (!storageKey?.startsWith(STORAGE_KEY_PREFIX)) continue
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) continue
      const data = JSON.parse(raw) as ChartLayout
      result.push({
        key: storageKey.slice(STORAGE_KEY_PREFIX.length),
        timestamp: data.timestamp,
      })
    } catch {
      /* 忽略损坏的数据 */
    }
  }
  return result.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Migrate persisted layouts from older versions to the current schema.
 * Returns null if the payload cannot be migrated.
 * Plug new migration steps here when CURRENT_VERSION is bumped.
 */
function asChartLayout(data: Record<string, unknown>): ChartLayout {
  return data as unknown as ChartLayout
}

function migrateLayout(data: Record<string, unknown>): ChartLayout | null {
  const version = data.version as number
  if (version > CURRENT_VERSION) {
    console.warn(`[TradingChest] layout version ${version} is newer than supported (${CURRENT_VERSION}); ignoring`)
    return null
  }
  if (version === CURRENT_VERSION) return asChartLayout(data)
  // No migrations yet; future versions chain here.
  return null
}
