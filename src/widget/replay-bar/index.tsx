import { Show, type Component } from 'solid-js'
import type { ReplayState, ReplaySpeed } from '../../replay/types'
import t from '../../i18n'
import './index.css'

export interface ReplayControlBarProps {
  lang: string
  localeKey?: number
  state: ReplayState
  onPlay: () => void
  onPause: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onSpeedChange: (speed: ReplaySpeed) => void
  onPositionChange: (position: number) => void
  onStop: () => void
}

const SPEEDS: ReplaySpeed[] = [1, 2, 4, 8, 16]

const ReplayControlBar: Component<ReplayControlBarProps> = (props) => {
  void props.localeKey
  const nextSpeed = () => {
    const idx = SPEEDS.indexOf(props.state.speed)
    return SPEEDS[(idx + 1) % SPEEDS.length]
  }

  return (
    <Show when={props.state.active}>
      <div class="klinecharts-pro-replay-bar">
        <div
          class="replay-btn step-backward"
          onClick={props.onStepBackward}
          title={t('replay_back', props.lang)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="scale(-1,1) translate(-24,0)" />
          </svg>
        </div>
        <div
          class="replay-btn play-pause"
          onClick={() => (props.state.playing ? props.onPause() : props.onPlay())}
        >
          {props.state.playing ? (
            <svg viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
        <div
          class="replay-btn step-forward"
          onClick={props.onStepForward}
          title={t('replay_forward', props.lang)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </div>
        <span
          class="replay-speed"
          onClick={() => props.onSpeedChange(nextSpeed())}
          title={t('replay_speed', props.lang)}
        >
          {props.state.speed}x
        </span>
        <div class="replay-progress">
          <span>{props.state.position}</span>
          <input
            type="range"
            class="replay-progress-slider"
            min={1}
            max={props.state.totalBars}
            value={props.state.position}
            onInput={(e) => {
              const n = parseInt((e.target as HTMLInputElement).value, 10)
              if (Number.isFinite(n)) props.onPositionChange(n)
            }}
          />
          <span>{props.state.totalBars}</span>
        </div>
        <span class="replay-exit" onClick={props.onStop}>
          {t('replay_exit', props.lang)}
        </span>
      </div>
    </Show>
  )
}

export default ReplayControlBar
