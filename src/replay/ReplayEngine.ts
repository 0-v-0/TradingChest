import type { KLineData } from 'klinecharts'
import type { ReplayState, ReplaySpeed, ReplayCallbacks } from './types'

const BASE_INTERVAL = 1000

export class ReplayEngine {
  #fullData: KLineData[] = []
  #viewData: KLineData[] = []
  #position = 0
  #playing = false
  #speed: ReplaySpeed = 1
  #active = false
  #timer?: ReturnType<typeof setTimeout>
  #callbacks: ReplayCallbacks

  constructor(callbacks: ReplayCallbacks) {
    this.#callbacks = callbacks
  }

  start(data: KLineData[], startPosition: number): void {
    this.#fullData = data
    this.#position = data.length ? Math.max(1, Math.min(startPosition, data.length)) : 0
    this.#viewData = this.#fullData.slice(0, this.#position)
    this.#active = data.length > 0
    this.#playing = false
    this.#speed = 1
    this.#stopTimer()
    this.#callbacks.onDataChange(this.#viewData)
    this.#emitState()
  }

  stop(): void {
    this.#stopTimer()
    this.#active = false
    this.#playing = false
    this.#emitState()
  }

  stepForward(): void {
    if (!this.#active || this.#position >= this.#fullData.length) return
    this.#position++
    this.#callbacks.onBarUpdate(this.#fullData[this.#position - 1])
    this.#emitState()
  }

  stepBackward(): void {
    if (!this.#active || this.#position <= 1) return
    this.#position--
    this.#viewData.length = this.#position
    this.#callbacks.onDataChange(this.#viewData)
    this.#emitState()
  }

  play(): void {
    if (!this.#active || this.#playing) return
    this.#playing = true
    this.#schedule()
    this.#emitState()
  }

  pause(): void {
    this.#playing = false
    this.#stopTimer()
    this.#emitState()
  }

  setSpeed(speed: ReplaySpeed): void {
    this.#speed = speed
    if (this.#playing) {
      this.#stopTimer()
      this.#schedule()
    }
    this.#emitState()
  }

  goToPosition(position: number): void {
    if (!this.#active) return
    this.#position = Math.max(1, Math.min(position, this.#fullData.length))
    // Truncate in-place instead of allocating a new array per frame
    this.#viewData.length = this.#position
    for (let i = this.#viewData.length; i < this.#position; i++) {
      this.#viewData[i] = this.#fullData[i]
    }
    this.#callbacks.onDataChange(this.#viewData)
    this.#emitState()
  }

  getState(): ReplayState {
    return {
      active: this.#active,
      playing: this.#playing,
      speed: this.#speed,
      position: this.#position,
      totalBars: this.#fullData.length,
    }
  }

  dispose(): void {
    this.#stopTimer()
    this.#fullData = []
    this.#viewData = []
    this.#active = false
    this.#playing = false
    this.#callbacks = { onDataChange: () => {}, onBarUpdate: () => {}, onStateChange: () => {} } as ReplayCallbacks
  }

  #schedule(): void {
    if (!this.#playing || this.#speed <= 0) return
    const interval = BASE_INTERVAL / this.#speed
    this.#timer = setTimeout(() => {
      this.#timer = undefined
      if (!this.#playing) return
      if (this.#position >= this.#fullData.length) {
        this.pause()
        return
      }
      this.stepForward()
      this.#schedule()
    }, interval)
  }

  #stopTimer(): void {
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    }
  }

  #emitState(): void {
    this.#callbacks.onStateChange(this.getState())
  }
}
