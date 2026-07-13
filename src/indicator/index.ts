import { registerIndicator } from 'klinecharts'
import { indicatorLoaders } from './loaders'
import { IndicatorRegistry } from './registry'

// Global singleton registry
export const indicatorRegistry = new IndicatorRegistry()
indicatorRegistry.setRegisterFn(registerIndicator)
indicatorRegistry.setLoaders(indicatorLoaders)

// 指标分类映射（用于 UI 分类显示）
// 名称必须与 IndicatorTemplate.name 完全一致
// labelKey 对应 i18n key（如 'category_trend'）
export const indicatorCategories: Record<string, { names: string[]; labelKey: string }> = {
  trend: {
    names: [
      'MA',
      'EMA',
      'SMA',
      'BOLL',
      'SAR',
      'BBI',
      'ATR',
      'SUPERTREND',
      'ICHIMOKU',
      'ALLIGATOR',
      'DEMA',
      'TEMA',
      'WMA',
      'HMA',
      'KAMA',
      'VWMA',
      'ZLEMA',
      'MCGINLEY',
      'LINEARREGRESSION',
      'ENVELOPES',
      'T3',
      'ChanDeKrollStop',
      'Qstick',
      'RainbowMA',
      'LinearRegressionForecast',
    ],
    labelKey: 'category_trend',
  },
  volatility: {
    names: ['KC', 'DC', 'HV', 'STDDEV', 'CV', 'MI', 'UI', 'BBW', 'StandardError'],
    labelKey: 'category_volatility',
  },
  volume: {
    names: [
      'VOL',
      'OBV',
      'PVT',
      'VR',
      'VWAP',
      'MFI',
      'CMF',
      'AD',
      'VROC',
      'KVO',
      'FI',
      'ELDER_RAY',
      'VolumeOscillator',
    ],
    labelKey: 'category_volume',
  },
  momentum: {
    names: [
      'MACD',
      'KDJ',
      'RSI',
      'BIAS',
      'BRAR',
      'CCI',
      'DMI',
      'CR',
      'PSY',
      'DMA',
      'TRIX',
      'WR',
      'MTM',
      'EMV',
      'ROC',
      'AO',
      'StochRSI',
      'ADX',
      'AROON',
      'UO',
      'FISHER',
      'COPPOCK',
      'PPO',
      'DPO',
      'KST',
      'TMF',
      'ConnorsRSI',
      'EhlersLeading',
      'WilliamsR',
    ],
    labelKey: 'category_momentum',
  },
   other: {
     names: ['PIVOTPOINTS', 'ZIGZAG', 'CorrelationCoefficient', 'TradeVis'],
     labelKey: 'category_other',
   },
}
