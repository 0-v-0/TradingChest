export interface ReconnectOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

export class ReconnectingWebSocket {
  #url: string
  #ws?: WebSocket
  #retryCount = 0
  #maxRetries: number
  #baseDelay: number
  #maxDelay: number
  #disposed = false
  #retryTimer?: ReturnType<typeof setTimeout>

  onopen?: (ev: Event) => void
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null
  onerror: ((this: WebSocket, ev: Event) => void) | null = null
  onclose?: (ev: CloseEvent) => void
  onreconnect?: (attempt: number) => void

  constructor(url: string, options?: ReconnectOptions) {
    this.#url = url
    this.#maxRetries = options?.maxRetries ?? 5
    this.#baseDelay = options?.baseDelay ?? 1000
    this.#maxDelay = options?.maxDelay ?? 30000

    try {
      this.#connect()
    } catch (e) {
      this.#scheduleReconnect()
      if (e instanceof Event) {
        this.#ws?.onerror?.(e)
      } else {
        this.#ws?.onerror?.(new Event(String(e)))
      }
    }
  }

  #connect(): void {
    if (this.#disposed) return
    // Close any existing socket before creating a new one to prevent leaks
    if (this.#ws) {
      this.#ws.onopen = null
      this.#ws.onmessage = null
      this.#ws.onerror = null
      this.#ws.onclose = null
      if (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING) {
        this.#ws.close()
      }
      this.#ws = undefined
    }
    this.#ws = new WebSocket(this.#url)

    this.#ws.onopen = (ev) => {
      this.#retryCount = 0
      this.onopen?.(ev)
    }

    this.#ws.onmessage = this.onmessage

    this.#ws.onerror = this.onerror

    this.#ws.onclose = (ev) => {
      if (this.#disposed) {
        this.onclose?.(ev)
        return
      }
      this.onclose?.(ev)
      this.#scheduleReconnect()
    }
  }

  #scheduleReconnect(): void {
    if (this.#retryTimer || this.#disposed) return
    if (this.#retryCount >= this.#maxRetries) return
    const base = Math.min(this.#baseDelay * Math.pow(2, this.#retryCount), this.#maxDelay)
    const jitter = base * (0.5 + Math.random() * 0.5)
    this.#retryCount++
    this.onreconnect?.(this.#retryCount)
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined
      try {
        this.#connect()
      } catch (e) {
        this.#scheduleReconnect()
        if (e instanceof Event) this.#ws?.onerror?.(e)
        else this.#ws?.onerror?.(new Event(String(e)))
      }
    }, jitter)
  }

  send(data: BufferSource | Blob | string): void {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(data)
    }
  }

  close(): void {
    if (this.#disposed) return
    this.#disposed = true
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer)
      this.#retryTimer = undefined
    }
    this.#ws?.close()
    this.#ws = undefined
  }

  get readyState(): number {
    return this.#ws?.readyState ?? WebSocket.CLOSED
  }

  get isOpen(): boolean {
    return this.readyState === WebSocket.OPEN
  }
}
