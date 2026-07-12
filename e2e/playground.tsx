import { render } from 'solid-js/web'
import ChartProComponent from '../src/ChartProComponent'
import type { SymbolInfo, Period, Datafeed } from '../src/types'

const mockSymbol: SymbolInfo = {
  ticker: 'BTC/USDT',
  name: 'Bitcoin',
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

const mockDatafeed: Datafeed = {
  searchSymbols: async () => [mockSymbol],
  getHistoryKLineData: async () => {
    return staticData
  },
  subscribe: () => {},
  unsubscribe: () => {},
}

;(window as any).mockSymbol = mockSymbol
;(window as any).mockPeriod = mockPeriods[0]

let chartInstance: any = null

function generateStaticData(): any[] {
  const data: any[] = []
  let basePrice = 45000
  const now = Date.now()
  const interval = 60000

  for (let i = 99; i >= 0; i--) {
    const volatility = (Math.random() - 0.5) * 2000
    const open = basePrice
    const close = basePrice + volatility
    const high = Math.max(open, close) + Math.random() * 500
    const low = Math.min(open, close) - Math.random() * 500

    data.push({
      timestamp: now - i * interval,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000) + 1000,
    })

    basePrice = close
  }

  return data
}

const staticData = generateStaticData()
;(window as any).staticData = staticData

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', 'background-color': '#151517' }}>
      <ChartProComponent
        ref={(chart) => {
          chartInstance = chart
          ;(window as any).chartInstance = chart
        }}
        symbol={mockSymbol}
        period={mockPeriods[0]}
        periods={mockPeriods}
        datafeed={mockDatafeed}
        styles={{}}
        watermark=""
        theme="dark"
        locale="en-US"
        timezone="Asia/Shanghai"
        mainIndicators={['MA']}
        subIndicators={[]}
        drawingBarVisible={true}
        onPeriodChange={() => {}}
        onIndicatorClick={() => {}}
        onOverlayCreate={() => {}}
        onOverlayUpdate={() => {}}
        onOverlayDelete={() => {}}
      />
    </div>
  )
}

render(App, document.getElementById('root')!)
