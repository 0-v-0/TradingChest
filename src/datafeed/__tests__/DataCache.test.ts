import { describe, it, expect } from 'vitest'
import { DataCache } from '../DataCache'

describe('DataCache', () => {
  it('set + get 基本往返', () => {
    const cache = new DataCache()
    const data = [
      { timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100, turnover: 0 }
    ]
    cache.set('BTC-USDT', '1m', data)
    const result = cache.get('BTC-USDT', '1m')
    expect(result).toEqual(data)
  })

  it('不同 symbol/period 互不干扰', () => {
    const cache = new DataCache()
    cache.set('BTC', '1m', [{ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1, turnover: 0 }])
    cache.set('ETH', '1m', [{ timestamp: 2, open: 2, high: 2, low: 2, close: 2, volume: 2, turnover: 0 }])
    expect(cache.get('BTC', '1m')![0].timestamp).toBe(1)
    expect(cache.get('ETH', '1m')![0].timestamp).toBe(2)
  })

  it('miss 返回 null', () => {
    const cache = new DataCache()
    expect(cache.get('NONE', '1m')).toBeNull()
  })

  it('clear 清空全部', () => {
    const cache = new DataCache()
    cache.set('BTC', '1m', [])
    cache.clear()
    expect(cache.get('BTC', '1m')).toBeNull()
  })

  it('append 追加数据并去重', () => {
    const cache = new DataCache()
    cache.set('BTC', '1m', [
      { timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100, turnover: 0 }
    ])
    cache.append('BTC', '1m', [
      { timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.8, volume: 110, turnover: 0 },
      { timestamp: 2000, open: 2, high: 3, low: 1.5, close: 2.5, volume: 200, turnover: 0 }
    ])
    const result = cache.get('BTC', '1m')!
    expect(result).toHaveLength(2)
    expect(result[0].close).toBe(1.8)
    expect(result[1].timestamp).toBe(2000)
  })

  it('delete 移除指定 symbol+period', () => {
    const cache = new DataCache()
    cache.set('BTC', '1m', [{ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1, turnover: 0 }])
    cache.set('ETH', '1m', [{ timestamp: 2, open: 2, high: 2, low: 2, close: 2, volume: 2, turnover: 0 }])
    cache.delete('BTC', '1m')
    expect(cache.get('BTC', '1m')).toBeNull()
    expect(cache.get('ETH', '1m')).not.toBeNull()
  })

  it('LRU evicts oldest entry when maxEntries exceeded', () => {
    const cache = new DataCache(2)
    cache.set('A', '1m', [{ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1, turnover: 0 }])
    cache.set('B', '1m', [{ timestamp: 2, open: 2, high: 2, low: 2, close: 2, volume: 2, turnover: 0 }])
    cache.set('C', '1m', [{ timestamp: 3, open: 3, high: 3, low: 3, close: 3, volume: 3, turnover: 0 }])
    expect(cache.get('A', '1m')).toBeNull()
    expect(cache.get('B', '1m')).not.toBeNull()
    expect(cache.get('C', '1m')).not.toBeNull()
  })

  it('get refreshes LRU order', () => {
    const cache = new DataCache(2)
    cache.set('A', '1m', [{ timestamp: 1, open: 1, high: 1, low: 1, close: 1, volume: 1, turnover: 0 }])
    cache.set('B', '1m', [{ timestamp: 2, open: 2, high: 2, low: 2, close: 2, volume: 2, turnover: 0 }])
    cache.get('A', '1m') // refresh A
    cache.set('C', '1m', [{ timestamp: 3, open: 3, high: 3, low: 3, close: 3, volume: 3, turnover: 0 }])
    expect(cache.get('A', '1m')).not.toBeNull()
    expect(cache.get('B', '1m')).toBeNull()
  })
})
