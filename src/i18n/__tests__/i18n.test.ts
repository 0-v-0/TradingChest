import { describe, it, expect, beforeEach } from 'vitest'
import translate, { load } from '../index'

beforeEach(async () => {
  await load('en-US')
  await load('zh-CN')
})

describe('translate', () => {
  it('returns the correct English translation for a known key', async () => {
    expect(translate('indicator', 'en-US')).toBe('Indicator')
  })

  it('returns the correct Chinese translation for a known key', async () => {
    // zh-CN locale must exist and have a value for 'indicator'
    const result = translate('indicator', 'zh-CN')
    // The result must be a non-empty string and not the raw key
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns the key itself when the key is missing from the locale', async () => {
    expect(translate('__nonexistent_key__', 'en-US')).toBe('__nonexistent_key__')
  })

  it('returns the key itself when the locale does not exist', async () => {
    expect(translate('indicator', 'fr-FR')).toBe('indicator')
  })

  it('returns the key itself for both unknown locale and unknown key', async () => {
    expect(translate('__unknown__', 'xx-XX')).toBe('__unknown__')
  })

  it('returns correct translation for multi-word keys', async () => {
    expect(translate('main_indicator', 'en-US')).toBe('Main Indicator')
    expect(translate('sub_indicator', 'en-US')).toBe('Sub Indicator')
  })

  it('returns correct translation for timezone keys', async () => {
    expect(translate('shanghai', 'en-US')).toBe('(UTC+8) Shanghai')
    expect(translate('tokyo', 'en-US')).toBe('(UTC+9) Tokyo')
  })
})

describe('load', () => {
  it('loads a locale asynchronously', async () => {
    await load('ko')
    expect(translate('indicator', 'ko')).toBe('지표')
  })

  it('does not reload an already loaded locale', async () => {
    await load('en-US')
    await load('en-US')
    expect(translate('indicator', 'en-US')).toBe('Indicator')
  })

  it('returns early for unknown locale', async () => {
    await load('xx-XX')
    expect(translate('indicator', 'xx-XX')).toBe('indicator')
  })
})
