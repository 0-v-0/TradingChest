import { type Component, For, createMemo } from 'solid-js'
import { finite, pathFromPoints } from './svg-utils'
import t from '../i18n'

export interface DrawdownPoint {
  timestamp: string
  drawdown_pct?: number | null
}

export interface DrawdownAreaChartProps {
  series: ReadonlyArray<DrawdownPoint>
  height?: number
  className?: string
  lang?: string
}

const WIDTH = 720
const DEFAULT_HEIGHT = 220
const PAD_X = 44
const PAD_Y = 24

export const DrawdownAreaChart: Component<DrawdownAreaChartProps> = (props) => {
  const height = () => props.height ?? DEFAULT_HEIGHT

  const chartData = createMemo(() => {
    const h = height()
    const usableWidth = WIDTH - PAD_X * 2
    const usableHeight = h - PAD_Y * 2
    // Single pass: extract values, find min/max, build points
    let minValue = -0.01
    let maxValue = 0
    const points: [number, number][] = []
    let latest: number | undefined
    const len = props.series.length
    for (let i = 0; i < len; i++) {
      const value = props.series[i].drawdown_pct
      if (finite(value)) {
        if (value < minValue) minValue = value
        if (value > maxValue) maxValue = value
        points.push([
          len <= 1 ? PAD_X + usableWidth / 2 : PAD_X + (i / (len - 1)) * usableWidth,
        0, // placeholder, will compute yFor after range is known
        ])
        latest = value
      }
    }
    const range = Math.max(maxValue - minValue, 0.01)
    const yFor = (value: number) => PAD_Y + ((maxValue - value) / range) * usableHeight
    // Fill in y-coordinates now that range is known
    let pi = 0
    for (let i = 0; i < len; i++) {
      const value = props.series[i].drawdown_pct
      if (finite(value)) {
        points[pi][1] = yFor(value)
        pi++
      }
    }
    const zeroY = yFor(0)
    const linePath = points.length > 0 ? pathFromPoints(points) : ''
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${zeroY.toFixed(2)} L ${points[0][0].toFixed(2)} ${zeroY.toFixed(2)} Z`
        : ''
    return { points, linePath, areaPath, zeroY, latest, height: h }
  })

  return (
    <div
      class={props.className}
      data-testid="drawdown-area-chart"
      style={{
        border: '1px solid #d7dde8',
        'border-radius': '8px',
        background: '#ffffff',
        padding: '12px',
        'min-height': `${chartData().height + 24}px`,
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
        <strong style={{ 'font-size': '14px', color: '#172033' }}>{t('drawdown_chart_title', props.lang ?? 'en-US')}</strong>
        <span style={{ 'font-size': '12px', color: '#b42318' }}>
          {chartData().latest !== undefined ? `${t('label_current', props.lang ?? 'en-US')} ${(chartData().latest! * 100).toFixed(2)}%` : t('label_no_data', props.lang ?? 'en-US')}
        </span>
      </div>
      <svg
        role="img"
        aria-label="drawdown underwater area chart"
        viewBox={`0 0 ${WIDTH} ${chartData().height}`}
        width="100%"
        height={chartData().height}
        preserveAspectRatio="none"
      >
        <rect
          x={PAD_X}
          y={PAD_Y}
          width={WIDTH - PAD_X * 2}
          height={chartData().height - PAD_Y * 2}
          fill="#fff7f7"
          stroke="#fee4e2"
        />
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={chartData().zeroY}
          y2={chartData().zeroY}
          stroke="#667085"
          stroke-width="1"
        />
        {chartData().areaPath && <path d={chartData().areaPath} fill="rgba(217, 45, 32, 0.22)" stroke="none" />}
        {chartData().linePath ? (
          <path
            d={chartData().linePath}
            fill="none"
            stroke="#d92d20"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
          />
        ) : (
          <text x={WIDTH / 2} y={chartData().height / 2} text-anchor="middle" fill="#667085" font-size="13">
            {t('no_drawdown_data', props.lang ?? 'en-US')}
          </text>
        )}
        <For each={chartData().points}>{([x, y]) => <circle cx={x} cy={y} r="3.5" fill="#d92d20" />}</For>
      </svg>
    </div>
  )
}
