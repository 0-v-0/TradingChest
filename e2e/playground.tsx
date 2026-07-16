import KLineChartPro from '../src/KLineChartPro'
import '../src/index.css'
// Ensure chart type indicators and overlays are registered (normally done by src/index.ts side effects)
import { registerIndicator, registerOverlay } from 'klinecharts'
import chartTypes from '../src/chartType'
import overlays from '../src/extension'
import tradeVisualization from '../src/indicator/trade/tradeVisualization'
chartTypes.forEach(ct => registerIndicator(ct))
overlays.forEach(o => registerOverlay(o))
registerIndicator(tradeVisualization)
import type { SymbolInfo, Period, Datafeed } from '../src/types'
import type { KLineData } from 'klinecharts'

// Seeded PRNG (mulberry32) for deterministic test data
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const rand = seededRandom(42)

const mockSymbol: SymbolInfo = {
  ticker: 'BTC/USDT',
  name: 'Bitcoin',
  pricePrecision: 2,
  volumePrecision: 0,
  priceCurrency: 'USDT',
}

const ethSymbol: SymbolInfo = {
  ticker: 'ETH/USDT',
  name: 'Ethereum',
  pricePrecision: 2,
  volumePrecision: 0,
  priceCurrency: 'USDT',
}

const mockPeriods: Period[] = [
  { multiplier: 1, timespan: 'minute', text: '1m' },
  { multiplier: 5, timespan: 'minute', text: '5m' },
  { multiplier: 15, timespan: 'minute', text: '15m' },
  { multiplier: 1, timespan: 'hour', text: '1H' },
  { multiplier: 4, timespan: 'hour', text: '4H' },
  { multiplier: 1, timespan: 'day', text: '1D' },
]

function generateStaticData(count: number, basePrice: number): KLineData[] {
  const data: KLineData[] = []
  let price = basePrice
  const now = Date.now()
  const interval = 60000

  for (let i = count - 1; i >= 0; i--) {
    const volatility = (rand() - 0.5) * 2000
    const open = price
    const close = price + volatility
    const high = Math.max(open, close) + rand() * 500
    const low = Math.min(open, close) - rand() * 500

    data.push({
      timestamp: now - i * interval,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(rand() * 10000) + 1000,
    })

    price = close
  }

  return data
}

const staticData = generateStaticData(500, 45000)
const ethData = generateStaticData(500, 3000)

// Expose data for test assertions
globalThis.staticData = staticData
globalThis.ethData = ethData
globalThis.mockSymbol = mockSymbol
globalThis.mockPeriod = mockPeriods[0]

// Lifecycle event storage
const alertEvents: typeof globalThis.alertEvents = []
const overlayEvents: typeof globalThis.overlayEvents = []
globalThis.alertEvents = alertEvents
globalThis.overlayEvents = overlayEvents

const mockDatafeed: Datafeed = {
  searchSymbols: async (search?: string) => {
    const symbols = [mockSymbol, ethSymbol]
    if (!search) return symbols
    return symbols.filter(s => s.ticker.toLowerCase().includes(search.toLowerCase()))
  },
  getHistoryKLineData: async (symbol, _period, _from, _to) => {
    if (symbol.ticker === 'ETH/USDT') return ethData
    return staticData
  },
  subscribe: () => {},
  unsubscribe: () => {},
}

// Pre-load locale data then create KLineChartPro instance
const container = document.getElementById('root')!
KLineChartPro.preloadLocale('en-US').then(() => {
  const chartInstance = new KLineChartPro({
  container,
  symbol: mockSymbol,
  period: mockPeriods[0],
  periods: mockPeriods,
  datafeed: mockDatafeed,
  styles: {},
  watermark: '',
  theme: 'dark',
  locale: 'en-US',
  timezone: 'Asia/Shanghai',
  mainIndicators: ['MA'],
  subIndicators: [],
  drawingBarVisible: true,
  onAlertTrigger: (event) => {
    alertEvents.push(event)
  },
  onOverlayCreate: (event) => {
    overlayEvents.push({ type: 'create', ...event })
  },
  onOverlayUpdate: (event) => {
    overlayEvents.push({ type: 'update', ...event })
  },
  onOverlayDelete: (event) => {
    overlayEvents.push({ type: 'delete', ...event })
  },
  })

  globalThis.chartInstance = chartInstance
})
