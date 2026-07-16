import type { KLineData } from 'klinecharts'
import { ReconnectingWebSocket } from './datafeed/ReconnectingWebSocket'
import DEMO_LOGO from './datafeed/logo.png'
import type { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback } from './types'

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'failed'

/** Demo datafeed for Polygon.io. Production should proxy API calls through a backend to avoid exposing API keys. */
export default class DefaultDatafeed implements Datafeed {
  constructor(
    apiKey: string,
    options?: {
      onConnectionStateChange?: (
        state: ConnectionState,
        detail?: { attempt?: number; error?: unknown },
      ) => void
      fetchTimeout?: number
      onError?: (error: { type: string; message: string; raw?: unknown }) => void
    },
  ) {
    if (import.meta.env?.PROD) {
      console.warn(
        '[TradingChest] DefaultDatafeed is a demo datafeed. ' +
        'Do NOT use it in production — API keys will be exposed to the client. ' +
        'Proxy API calls through your backend instead.',
      )
    }
    this.#apiKey = apiKey
    this.#onConnectionStateChange = options?.onConnectionStateChange
    this.#fetchTimeout = options?.fetchTimeout ?? 15000
    this.#onError = options?.onError
  }

  #apiKey: string
  #onConnectionStateChange?: (state: ConnectionState,
    detail?: { attempt?: number; error?: unknown }) => void

  #fetchTimeout: number
  #onError?: (error: { type: string; message: string; raw?: unknown }) => void

  #prevSymbolMarket?: string
  #prevTicker?: string
  #currentTicker?: string
  #authed = false

  #ws?: ReconnectingWebSocket

  #callback?: DatafeedSubscribeCallback

  async searchSymbols(search?: string): Promise<SymbolInfo[]> {
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?active=true&search=${encodeURIComponent(search ?? '')}`,
        {
          headers: { Authorization: `Bearer ${this.#apiKey}` },
          signal: AbortSignal.timeout(this.#fetchTimeout),
        },
      )
      if (!response.ok) {
        const msg = `searchSymbols failed: ${response.status} ${response.statusText}`
        console.warn(msg)
        this.#onError?.({ type: 'search', message: msg })
        return []
      }
      const result = await response.json()
      return (result.results || []).map((data: Record<string, string>) => ({
        ticker: data.ticker,
        name: data.name,
        shortName: data.ticker,
        market: data.market,
        exchange: data.primary_exchange,
        priceCurrency: data.currency_name,
        type: data.type,
        logo: DEMO_LOGO,
      }))
    } catch (e) {
      console.warn('searchSymbols error:', e)
      this.#onError?.({ type: 'search', message: 'Symbol search failed', raw: e })
      return []
    }
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: Period,
    from: number,
    to: number,
  ): Promise<KLineData[]> {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol.ticker)}/range/${period.multiplier}/${period.timespan}/${from}/${to}`,
        {
          headers: { Authorization: `Bearer ${this.#apiKey}` },
          signal: AbortSignal.timeout(this.#fetchTimeout),
        },
      )
      if (!response.ok) {
        const msg = `getHistoryKLineData failed: ${response.status} ${response.statusText}`
        console.warn(msg)
        this.#onError?.({ type: 'history', message: msg })
        return []
      }
      const result = await response.json()
      return (result.results || []).map((data: Record<string, number>) => ({
        timestamp: data.t,
        open: data.o,
        high: data.h,
        low: data.l,
        close: data.c,
        volume: data.v,
        turnover: data.vw,
      }))
    } catch (e) {
      console.warn('getHistoryKLineData error:', e)
      this.#onError?.({ type: 'history', message: 'History data fetch failed', raw: e })
      return []
    }
  }

  subscribe(symbol: SymbolInfo, _period: Period, callback: DatafeedSubscribeCallback): void {
    // 始终更新回调引用，确保切换 ticker 后新回调生效
    this.#callback = callback
    const ticker = symbol.ticker
    if (this.#prevSymbolMarket !== symbol.market) {
      // 跨 market 切换：先在旧 socket 上 unsubscribe 旧 ticker，Polygon 不会自我感知 ticker 切换
      if (this.#ws && this.#prevTicker) {
        try {
          this.#ws.send(JSON.stringify({ action: 'unsubscribe', params: `T.${this.#prevTicker}` }))
        } catch {
          /* ws may already be closed */
        }
      }
      this.#currentTicker = ticker
      this.#ws?.close()
      this.#ws = new ReconnectingWebSocket(`wss://delayed.polygon.io/${symbol.market}`, {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000,
      })
      this.#ws.onopen = () => {
        this.#authed = false
        this.#ws?.send(JSON.stringify({ action: 'auth', params: this.#apiKey }))
      }
      this.#ws.onerror = () => {
        this.#onConnectionStateChange?.('disconnected', { error: 'WebSocket error' })
      }
      this.#ws.onclose = () => {
        this.#authed = false
        this.#onConnectionStateChange?.('disconnected')
      }
      this.#ws.onreconnect = (attempt) => {
        this.#onConnectionStateChange?.('reconnecting', { attempt })
      }
      this.#ws.onmessage = (event) => {
        let result: Array<Record<string, unknown>>
        try {
          result = JSON.parse(event.data)
        } catch {
          console.warn('[TradingChest] WebSocket: invalid JSON received')
          return
        }
        if (!Array.isArray(result) || result.length === 0) return
        if (result[0].ev === 'status') {
          if (result[0].status === 'auth_success') {
            this.#authed = true
            this.#onConnectionStateChange?.('connected')
            if (this.#currentTicker) {
              this.#ws?.send(JSON.stringify({ action: 'subscribe', params: `T.${this.#currentTicker}` }))
            }
          }
        } else {
          // Polygon batches multiple aggregate ticks in a single message —
          // process every entry, not just result[0].
          for (const frame of result) {
            if (!('sym' in frame)) continue
            const d = frame
            if (typeof d.s === 'number' && typeof d.o === 'number' &&
                typeof d.h === 'number' && typeof d.l === 'number' &&
                typeof d.c === 'number') {
              // 通过间接引用调用最新 callback，避免闭包捕获旧引用
              this.#callback?.({
                timestamp: d.s,
                open: d.o,
                high: d.h,
                low: d.l,
                close: d.c,
                volume: typeof d.v === 'number' ? d.v : 0,
                turnover: typeof d.vw === 'number' ? d.vw : undefined,
              })
            }
          }
        }
      }
    } else {
      // 同市场换品种时，先 unsubscribe 旧 ticker
      if (this.#prevTicker && this.#prevTicker !== ticker) {
        try {
          this.#ws?.send(JSON.stringify({ action: 'unsubscribe', params: `T.${this.#prevTicker}` }))
        } catch {
          /* ws may be closed */
        }
      }
      if (this.#currentTicker !== ticker) {
        this.#currentTicker = ticker
        if (this.#authed) {
          this.#ws?.send(JSON.stringify({ action: 'subscribe', params: `T.${ticker}` }))
        }
      }
    }
    this.#prevSymbolMarket = symbol.market
    this.#prevTicker = ticker
  }

  unsubscribe(symbol: SymbolInfo, _period: Period): void {
    if (this.#ws && this.#currentTicker === symbol.ticker) {
      try {
        this.#ws.send(JSON.stringify({ action: 'unsubscribe', params: `T.${symbol.ticker}` }))
      } catch {
        // WebSocket may already be closed
      }
      this.#currentTicker = undefined
      if (this.#prevTicker === symbol.ticker) {
        this.#prevTicker = undefined
      }
    }
    this.#callback = undefined
  }

  dispose(): void {
    this.#prevTicker = undefined
    this.#currentTicker = undefined
    this.#authed = false
    if (this.#ws) {
      this.#ws.close()
      this.#ws = undefined
    }
  }
}
