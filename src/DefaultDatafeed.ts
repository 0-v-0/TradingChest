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
    },
  ) {
    if (import.meta.env?.PROD) {
      console.warn(
        '[TradingChest] DefaultDatafeed is a demo datafeed. ' +
        'Do NOT use it in production — API keys will be exposed to the client. ' +
        'Proxy API calls through your backend instead.',
      )
    }
    this._apiKey = apiKey
    this._onConnectionStateChange = options?.onConnectionStateChange ?? null
    this._fetchTimeout = options?.fetchTimeout ?? 15000
  }

  private _apiKey: string
  private _onConnectionStateChange:
    | ((state: ConnectionState, detail?: { attempt?: number; error?: unknown }) => void)
    | null
  private _fetchTimeout: number

  private _prevSymbolMarket?: string
  private _prevTicker?: string
  private _currentTicker?: string

  private _ws?: ReconnectingWebSocket

  private _callback?: DatafeedSubscribeCallback

  async searchSymbols(search?: string): Promise<SymbolInfo[]> {
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?active=true&search=${encodeURIComponent(search ?? '')}`,
        {
          headers: { Authorization: `Bearer ${this._apiKey}` },
          signal: AbortSignal.timeout(this._fetchTimeout),
        },
      )
      if (!response.ok) {
        console.warn(`searchSymbols failed: ${response.status} ${response.statusText}`)
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
          headers: { Authorization: `Bearer ${this._apiKey}` },
          signal: AbortSignal.timeout(this._fetchTimeout),
        },
      )
      if (!response.ok) {
        console.warn(`getHistoryKLineData failed: ${response.status} ${response.statusText}`)
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
      return []
    }
  }

  subscribe(symbol: SymbolInfo, _period: Period, callback: DatafeedSubscribeCallback): void {
    // 始终更新回调引用，确保切换 ticker 后新回调生效
    this._callback = callback
    const ticker = symbol.ticker
    if (this._prevSymbolMarket !== symbol.market) {
      // 跨 market 切换：先在旧 socket 上 unsubscribe 旧 ticker，Polygon 不会自我感知 ticker 切换
      if (this._ws && this._prevTicker) {
        try {
          this._ws.send(JSON.stringify({ action: 'unsubscribe', params: `T.${this._prevTicker}` }))
        } catch {
          /* ws may already be closed */
        }
      }
      this._currentTicker = ticker
      this._ws?.close()
      this._ws = new ReconnectingWebSocket(`wss://delayed.polygon.io/${symbol.market}`, {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 30000,
      })
      this._ws.onopen = () => {
        this._ws?.send(JSON.stringify({ action: 'auth', params: this._apiKey }))
      }
      this._ws.onerror = () => {
        this._onConnectionStateChange?.('disconnected', { error: 'WebSocket error' })
      }
      this._ws.onclose = () => {
        this._onConnectionStateChange?.('disconnected')
      }
      this._ws.onreconnect = (attempt) => {
        this._onConnectionStateChange?.('reconnecting', { attempt })
      }
      this._ws.onmessage = (event) => {
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
            this._onConnectionStateChange?.('connected')
            if (this._currentTicker) {
              this._ws?.send(JSON.stringify({ action: 'subscribe', params: `T.${this._currentTicker}` }))
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
              this._callback?.({
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
      if (this._prevTicker && this._prevTicker !== ticker) {
        try {
          this._ws?.send(JSON.stringify({ action: 'unsubscribe', params: `T.${this._prevTicker}` }))
        } catch {
          /* ws may be closed */
        }
      }
      if (this._currentTicker !== ticker) {
        this._currentTicker = ticker
        this._ws?.send(JSON.stringify({ action: 'subscribe', params: `T.${ticker}` }))
      }
    }
    this._prevSymbolMarket = symbol.market
    this._prevTicker = ticker
  }

  unsubscribe(symbol: SymbolInfo, _period: Period): void {
    if (this._ws && this._currentTicker === symbol.ticker) {
      try {
        this._ws.send(JSON.stringify({ action: 'unsubscribe', params: `T.${symbol.ticker}` }))
      } catch {
        // WebSocket may already be closed
      }
      if (this._prevTicker === symbol.ticker) {
        this._prevTicker = undefined
        this._currentTicker = undefined
      } else {
        this._currentTicker = undefined
      }
    }
    this._callback = undefined
  }

  dispose(): void {
    this._prevTicker = undefined
    this._currentTicker = undefined
    if (this._ws) {
      this._ws.close()
      this._ws = undefined
    }
  }
}
