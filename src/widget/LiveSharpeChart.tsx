import { type Component, For, createMemo } from 'solid-js'
import { finite, pathFromPoints } from './svg-utils'
import t from '../i18n'

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
  lang?: string
}

const WIDTH = 720
const DEFAULT_HEIGHT = 240
const PAD_X = 44
const PAD_Y = 26

const formatValue = (value: number): string => value.toFixed(2)

export const LiveSharpeChart: Component<LiveSharpeChartProps> = (props) => {
  // charter D-03 + L-25 — DO NOT change the default M+1 threshold to mask bad live evidence.
  const threshold = () => props.threshold ?? 0.7
  const height = () => props.height ?? DEFAULT_HEIGHT

  const chartData = createMemo(() => {
    const h = height()
    const th = threshold()
    const usableWidth = WIDTH - PAD_X * 2
    const usableHeight = h - PAD_Y * 2
    // Single pass: extract values, find min/max, build points
    let minValue = Math.min(th, 0)
    let maxValue = Math.max(th, 1)
    const points: [number, number][] = []
    let latest: number | undefined
    const len = props.series.length
    for (let i = 0; i < len; i++) {
      const value = props.series[i].ratio ?? props.series[i].live_sharpe
      if (finite(value)) {
        if (value < minValue) minValue = value
        if (value > maxValue) maxValue = value
        points.push([
          len <= 1 ? PAD_X + usableWidth / 2 : PAD_X + (i / (len - 1)) * usableWidth,
          0,
        ])
        latest = value
      }
    }
    const range = Math.max(maxValue - minValue, 0.01)
    const yFor = (value: number) => PAD_Y + ((maxValue - value) / range) * usableHeight
    // Fill in y-coordinates now that range is known
    let pi = 0
    for (let i = 0; i < len; i++) {
      const value = props.series[i].ratio ?? props.series[i].live_sharpe
      if (finite(value)) {
        points[pi][1] = yFor(value)
        pi++
      }
    }
    const linePath = points.length > 0 ? pathFromPoints(points) : ''
    const thresholdY = yFor(th)
    return { points, linePath, thresholdY, latest, minValue, maxValue, height: h }
  })

  return (
    <div
      class={props.className}
      data-testid="live-sharpe-chart"
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
        <strong style={{ 'font-size': '14px', color: '#172033' }}>
          {t('sharpe_chart_title', props.lang ?? 'en-US')}
        </strong>
        <span
          style={{
            'font-size': '12px',
            color: chartData().latest !== undefined && chartData().latest! >= threshold() ? '#0f766e' : '#b42318',
          }}
        >
          {chartData().latest !== undefined
            ? `${t('label_current', props.lang ?? 'en-US')} ${formatValue(chartData().latest!)} / ${t('label_threshold', props.lang ?? 'en-US')} ${formatValue(threshold())}`
            : t('label_no_data', props.lang ?? 'en-US')}
        </span>
      </div>
      <svg
        role="img"
        aria-label="rolling 60 day sharpe ratio chart"
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
          fill="#f8fafc"
          stroke="#e2e8f0"
        />
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={chartData().thresholdY}
          y2={chartData().thresholdY}
          stroke="#d92d20"
          stroke-dasharray="5 5"
          stroke-width="2"
        />
        <text
          x={WIDTH - PAD_X}
          y={Math.max(14, chartData().thresholdY - 8)}
          text-anchor="end"
          fill="#b42318"
          font-size="12"
        >
          M+1 {formatValue(threshold())}
        </text>
        {chartData().linePath ? (
          <path
            d={chartData().linePath}
            fill="none"
            stroke="#2563eb"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
          />
        ) : (
          <text x={WIDTH / 2} y={chartData().height / 2} text-anchor="middle" fill="#667085" font-size="13">
            {t('no_live_data', props.lang ?? 'en-US')}
          </text>
        )}
        <For each={chartData().points}>{([x, y]) => <circle cx={x} cy={y} r="3.5" fill="#2563eb" />}</For>
      </svg>
    </div>
  )
}
