/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReconnectingWebSocket, type ReconnectOptions } from '../ReconnectingWebSocket'

// ---------------------------------------------------------------------------
// Mock WebSocket with static constants
// ---------------------------------------------------------------------------
class MockWS {
  static CONNECTING = 0 as const
  static OPEN = 1 as const
  static CLOSING = 2 as const
  static CLOSED = 3 as const

  readyState = 0 as number
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  send = vi.fn()
  close = vi.fn()

  constructor(public url: string) {}
}

let instances: MockWS[] = []
let OrigWS: typeof WebSocket

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ReconnectingWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    instances = []
    OrigWS = globalThis.WebSocket
    // A constructor that returns a MockWS instance when called with new
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor: any = function (_url: string) {
      const ws = new MockWS(_url)
      instances.push(ws)
      return ws
    }
    Ctor.CONNECTING = 0
    Ctor.OPEN = 1
    Ctor.CLOSING = 2
    Ctor.CLOSED = 3
    globalThis.WebSocket = Ctor
  })

  afterEach(() => {
    globalThis.WebSocket = OrigWS
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // Options
  // -------------------------------------------------------------------------
  describe('options', () => {
    it('uses default options', () => {
      const opts: ReconnectOptions = {}
      const resolved = {
        maxRetries: opts.maxRetries ?? 5,
        baseDelay: opts.baseDelay ?? 1000,
        maxDelay: opts.maxDelay ?? 30000,
      }
      expect(resolved.maxRetries).toBe(5)
      expect(resolved.baseDelay).toBe(1000)
      expect(resolved.maxDelay).toBe(30000)
    })

    it('exponential backoff caps at maxDelay', () => {
      const baseDelay = 1000
      const maxDelay = 30000
      for (let i = 0; i < 5; i++) {
        const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay)
        expect(delay).toBeLessThanOrEqual(maxDelay)
      }
      const delay5 = Math.min(baseDelay * Math.pow(2, 5), maxDelay)
      expect(delay5).toBe(maxDelay)
    })
  })

  // -------------------------------------------------------------------------
  // Connection lifecycle
  // -------------------------------------------------------------------------
  describe('connection lifecycle', () => {
    it('creates WebSocket on construction', () => {
      new ReconnectingWebSocket('wss://test', { maxRetries: 0 })
      expect(instances).toHaveLength(1)
      expect(instances[0].url).toBe('wss://test')
    })

    it('fires onopen when connected', () => {
      const onopen = vi.fn()
      new ReconnectingWebSocket('wss://test', { maxRetries: 0 })
      const ws = instances[0]
      ws.onopen?.(new Event('open'))
      expect(onopen).not.toHaveBeenCalled() // onopen not set yet

      const rws2 = new ReconnectingWebSocket('wss://test2', { maxRetries: 0 })
      rws2.onopen = onopen
      instances[1].onopen?.(new Event('open'))
      expect(onopen).toHaveBeenCalledTimes(1)
    })

    it('fires onmessage when data arrives', () => {
      const onmessage = vi.fn()
      const rws = new ReconnectingWebSocket('wss://test', { maxRetries: 0 })
      rws.onmessage = onmessage
      instances[0].onmessage?.(new MessageEvent('message', { data: 'hello' }))
      expect(onmessage).toHaveBeenCalledTimes(1)
    })

    it('send() forwards data when open', () => {
      const rws = new ReconnectingWebSocket('wss://test', { maxRetries: 0 })
      // Simulate open
      instances[0].readyState = 1 // OPEN
      rws.send('test-data')
      expect(instances[0].send).toHaveBeenCalledWith('test-data')
    })

    it('send() is no-op when not open', () => {
      const rws = new ReconnectingWebSocket('wss://test', { maxRetries: 0 })
      instances[0].readyState = 0 // CONNECTING
      rws.send('test-data')
      expect(instances[0].send).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Reconnection
  // -------------------------------------------------------------------------
  describe('reconnection', () => {
    it('schedules reconnect after close', () => {
      const onreconnect = vi.fn()
      const rws = new ReconnectingWebSocket('wss://test', {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
      })
      rws.onreconnect = onreconnect

      // Close first connection
      instances[0].onclose?.(new CloseEvent('close'))
      expect(onreconnect).toHaveBeenCalledWith(1)

      // Advance timers to trigger reconnect
      vi.advanceTimersByTime(200)
      expect(instances).toHaveLength(2) // new WebSocket created
    })

    it('stops retrying after maxRetries', () => {
      const onreconnect = vi.fn()
      new ReconnectingWebSocket('wss://test', {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
      })

      // Close first → attempt 1
      instances[0].onclose?.(new CloseEvent('close'))
      expect(onreconnect).not.toHaveBeenCalled() // callback not set yet

      vi.advanceTimersByTime(200)
      // Close second → attempt 2
      instances[1].onclose?.(new CloseEvent('close'))
      vi.advanceTimersByTime(200)

      // Close third → attempt 3, but maxRetries=2, so no more
      instances[2].onclose?.(new CloseEvent('close'))
      vi.advanceTimersByTime(2000)
      expect(instances).toHaveLength(3) // no 4th WebSocket
    })

    it('resets retry count on successful connection', () => {
      const onreconnect = vi.fn()
      const rws = new ReconnectingWebSocket('wss://test', {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
      })
      rws.onreconnect = onreconnect

      // Close → attempt 1
      instances[0].onclose?.(new CloseEvent('close'))
      expect(onreconnect).toHaveBeenCalledWith(1)
      vi.advanceTimersByTime(200)

      // Second connection succeeds
      instances[1].onopen?.(new Event('open'))

      // Close again → attempt 1 again (reset)
      instances[1].onclose?.(new CloseEvent('close'))
      expect(onreconnect).toHaveBeenCalledWith(1)
    })

    it('close() prevents further reconnection', () => {
      const onreconnect = vi.fn()
      const rws = new ReconnectingWebSocket('wss://test', {
        maxRetries: 5,
        baseDelay: 100,
        maxDelay: 1000,
      })
      rws.onreconnect = onreconnect

      instances[0].onclose?.(new CloseEvent('close'))
      expect(onreconnect).toHaveBeenCalledWith(1)

      rws.close()
      vi.advanceTimersByTime(2000)
      expect(instances).toHaveLength(1) // no new WebSocket
    })
  })
})
