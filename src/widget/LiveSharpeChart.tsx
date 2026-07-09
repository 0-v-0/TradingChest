import { type Component, For } from 'solid-js'

export interface LiveSharpePoint {
  timestamp: string
  live_sharpe?: number | null
  backtest_sharpe?: number | null
  ratio?: number | null
  sample_days?: number | null
}

export interface LiveSharpeChartProps {
  series: ReadonlyArray<LiveSharpePoint>
  threshold?: number
  height?: number
  className?: string
}

const WIDTH = 720
const DEFAULT_HEIGHT = 240
const PAD_X = 44
const PAD_Y = 26

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatValue = (value: number): string => value.toFixed(2)

const pathFromPoints = (points: ReadonlyArray<[number, number]>): string =>
  points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

export const LiveSharpeChart: Component<LiveSharpeChartProps> = (props) => {
  // charter D-03 + L-25 — DO NOT change the default M+1 threshold to mask bad live evidence.
  const threshold = props.threshold ?? 0.7
  const height = props.height ?? DEFAULT_HEIGHT
  const usableWidth = WIDTH - PAD_X * 2
  const usableHeight = height - PAD_Y * 2
  const values = props.series.map((point) => point.ratio ?? point.live_sharpe).filter(finite)
  const minValue = Math.min(threshold, ...values, 0)
  const maxValue = Math.max(threshold, ...values, 1)
  const range = Math.max(maxValue - minValue, 0.01)
  const yFor = (value: number) => PAD_Y + ((maxValue - value) / range) * usableHeight
  const xFor = (index: number) => {
    if (props.series.length <= 1) {
      return PAD_X + usableWidth / 2
    }
    return PAD_X + (index / (props.series.length - 1)) * usableWidth
  }
  const points = props.series
    .map((point, index): [number, number] | null => {
      const value = point.ratio ?? point.live_sharpe
      return finite(value) ? [xFor(index), yFor(value)] : null
    })
    .filter((point): point is [number, number] => point !== null)
  const linePath = points.length > 0 ? pathFromPoints(points) : ''
  const thresholdY = yFor(threshold)
  const latest = values.at(-1)

  return (
    <div
      class={props.className}
      data-testid="live-sharpe-chart"
      style={{
        border: '1px solid #d7dde8',
        'border-radius': '8px',
        background: '#ffffff',
        padding: '12px',
        'min-height': `${height + 24}px`,
      }}
    >
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          gap: '12px',
          'margin-bottom': '8px',
        }}
      >
        <strong style={{ 'font-size': '14px', color: '#172033' }}>
          Rolling 60D Sharpe / Ratio
        </strong>
        <span
          style={{
            'font-size': '12px',
            color: latest !== undefined && latest >= threshold ? '#0f766e' : '#b42318',
          }}
        >
          {latest !== undefined
            ? `当前 ${formatValue(latest)} / 阈值 ${formatValue(threshold)}`
            : '暂无数据'}
        </span>
      </div>
      <svg
        role="img"
        aria-label="rolling 60 day sharpe ratio chart"
        viewBox={`0 0 ${WIDTH} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
      >
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={usableWidth}
          height={usableHeight}
          fill="#f8fafc"
          stroke="#e2e8f0"
        />
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={thresholdY}
          y2={thresholdY}
          stroke="#d92d20"
          stroke-dasharray="5 5"
          stroke-width="2"
        />
        <text
          x={WIDTH - PAD_X}
          y={Math.max(14, thresholdY - 8)}
          text-anchor="end"
          fill="#b42318"
          font-size="12"
        >
          M+1 {formatValue(threshold)}
        </text>
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
          />
        ) : (
          <text x={WIDTH / 2} y={height / 2} text-anchor="middle" fill="#667085" font-size="13">
            暂无 LIVE 观察数据
          </text>
        )}
        <For each={points}>{([x, y]) => <circle cx={x} cy={y} r="3.5" fill="#2563eb" />}</For>
      </svg>
    </div>
  )
}
