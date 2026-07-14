export interface ReconnectOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
}

export class ReconnectingWebSocket {
  private _url: string
  private _ws: WebSocket | null = null
  private _retryCount = 0
  private _maxRetries: number
  private _baseDelay: number
  private _maxDelay: number
  private _disposed = false
  private _retryTimer: ReturnType<typeof setTimeout> | null = null

  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onreconnect: ((attempt: number) => void) | null = null

  constructor(url: string, options?: ReconnectOptions) {
    this._url = url
    this._maxRetries = options?.maxRetries ?? 5
    this._baseDelay = options?.baseDelay ?? 1000
    this._maxDelay = options?.maxDelay ?? 30000

    try {
      this._connect()
    } catch (e) {
      this._scheduleReconnect()
      if (e instanceof Event) {
        this.onerror?.(e)
      } else {
        throw e
      }
    }
  }

  private _connect(): void {
    if (this._disposed) return
    // Close any existing socket before creating a new one to prevent leaks
    if (this._ws) {
      this._ws.onopen = null
      this._ws.onmessage = null
      this._ws.onerror = null
      this._ws.onclose = null
      if (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING) {
        this._ws.close()
      }
      this._ws = null
    }
    this._ws = new WebSocket(this._url)

    this._ws.onopen = (ev) => {
      this._retryCount = 0
      this.onopen?.(ev)
    }

    this._ws.onmessage = (ev) => {
      this.onmessage?.(ev)
    }

    this._ws.onerror = (ev) => {
      this.onerror?.(ev)
    }

    this._ws.onclose = (ev) => {
      if (this._disposed) {
        this.onclose?.(ev)
        return
      }
      this.onclose?.(ev)
      this._scheduleReconnect()
    }
  }

  private _scheduleReconnect(): void {
    if (this._retryTimer || this._disposed) return
    if (this._retryCount >= this._maxRetries) return
    const base = Math.min(this._baseDelay * Math.pow(2, this._retryCount), this._maxDelay)
    const jitter = base * (0.5 + Math.random() * 0.5)
    this._retryCount++
    this.onreconnect?.(this._retryCount)
    this._retryTimer = setTimeout(() => {
      this._retryTimer = null
      try {
        this._connect()
      } catch (e) {
        this._scheduleReconnect()
        if (e instanceof Event) this.onerror?.(e)
        else throw e
      }
    }, jitter)
  }

  send(data: BufferSource | Blob | string): void {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(data)
    }
  }

  close(): void {
    if (this._disposed) return
    this._disposed = true
    if (this._retryTimer) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
    }
    this._ws?.close()
    this._ws = null
  }

  get readyState(): number {
    return this._ws?.readyState ?? WebSocket.CLOSED
  }

  get isOpen(): boolean {
    return this.readyState === WebSocket.OPEN
  }
}
