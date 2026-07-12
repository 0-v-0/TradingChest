import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getFavoriteIndicators,
  addFavoriteIndicator,
  removeFavoriteIndicator,
  isFavoriteIndicator,
  getFavoriteTools,
  addFavoriteTool,
  removeFavoriteTool,
  isFavoriteTool,
  _resetFavoritesCacheForTesting,
} from '../favorites'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key]
  }),
  get length() {
    return Object.keys(store).length
  },
  key: vi.fn(),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k])
  }),
}

vi.stubGlobal('localStorage', localStorageMock)

describe('favorites', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    _resetFavoritesCacheForTesting()
  })

  describe('indicators', () => {
    it('starts empty', () => {
      expect(getFavoriteIndicators()).toEqual([])
    })

    it('adds an indicator', () => {
      addFavoriteIndicator('MA')
      expect(getFavoriteIndicators()).toEqual(['MA'])
    })

    it('does not duplicate indicators', () => {
      addFavoriteIndicator('MA')
      addFavoriteIndicator('MA')
      expect(getFavoriteIndicators()).toEqual(['MA'])
    })

    it('removes an indicator', () => {
      addFavoriteIndicator('MA')
      addFavoriteIndicator('VOL')
      removeFavoriteIndicator('MA')
      expect(getFavoriteIndicators()).toEqual(['VOL'])
    })

    it('checks if indicator is favorite', () => {
      expect(isFavoriteIndicator('MA')).toBe(false)
      addFavoriteIndicator('MA')
      expect(isFavoriteIndicator('MA')).toBe(true)
    })

    it('removing non-existent indicator does not throw', () => {
      expect(() => removeFavoriteIndicator('nonexistent')).not.toThrow()
    })
  })

  describe('tools', () => {
    it('starts empty', () => {
      expect(getFavoriteTools()).toEqual([])
    })

    it('adds a tool', () => {
      addFavoriteTool('cursor')
      expect(getFavoriteTools()).toEqual(['cursor'])
    })

    it('does not duplicate tools', () => {
      addFavoriteTool('cursor')
      addFavoriteTool('cursor')
      expect(getFavoriteTools()).toEqual(['cursor'])
    })

    it('removes a tool', () => {
      addFavoriteTool('cursor')
      addFavoriteTool('crosshair')
      removeFavoriteTool('cursor')
      expect(getFavoriteTools()).toEqual(['crosshair'])
    })

    it('checks if tool is favorite', () => {
      expect(isFavoriteTool('cursor')).toBe(false)
      addFavoriteTool('cursor')
      expect(isFavoriteTool('cursor')).toBe(true)
    })
  })

  describe('persistence', () => {
    it('loads from localStorage', () => {
      store['trading-chest-favorites'] = JSON.stringify({ indicators: ['MA', 'VOL'], tools: ['cursor'] })
      expect(getFavoriteIndicators()).toEqual(['MA', 'VOL'])
      expect(getFavoriteTools()).toEqual(['cursor'])
    })

    it('handles corrupted localStorage data', () => {
      store['trading-chest-favorites'] = 'not json'
      expect(getFavoriteIndicators()).toEqual([])
    })
  })
})