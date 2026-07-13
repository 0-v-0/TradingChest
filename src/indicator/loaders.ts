import type { IndicatorTemplate } from 'klinecharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IndicatorLoader = () => Promise<IndicatorTemplate<any, any>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const load = (m: { default: IndicatorTemplate<any, any> }): IndicatorTemplate<any, any> => m.default

// oxfmt-ignore
export const indicatorLoaders: Record<string, IndicatorLoader> = {
  // Trend
  ATR:              () => import('./trend/atr').then(load),
  SUPERTREND:       () => import('./trend/superTrend').then(load),
  ICHIMOKU:         () => import('./trend/ichimoku').then(load),
  ALLIGATOR:        () => import('./trend/alligator').then(load),
  DEMA:             () => import('./trend/dema').then(load),
  TEMA:             () => import('./trend/tema').then(load),
  WMA:              () => import('./trend/wma').then(load),
  HMA:              () => import('./trend/hma').then(load),
  KAMA:             () => import('./trend/kama').then(load),
  VWMA:             () => import('./trend/vwma').then(load),
  ZLEMA:            () => import('./trend/zlema').then(load),
  MCGINLEY:         () => import('./trend/mcginley').then(load),
  LINEARREGRESSION: () => import('./trend/linearRegression').then(load),
  ENVELOPES:        () => import('./trend/envelopes').then(load),
  T3:               () => import('./trend/t3').then(load),
  ChanDeKrollStop:          () => import('./trend/chandeKrollStop').then(load),
  Qstick:                   () => import('./trend/qstick').then(load),
  RainbowMA:                () => import('./trend/rainbowMa').then(load),
  LinearRegressionForecast: () => import('./trend/linearRegressionForecast').then(load),
  // Volatility
  KC:     () => import('./volatility/keltnerChannels').then(load),
  DC:     () => import('./volatility/donchianChannels').then(load),
  HV:     () => import('./volatility/historicalVolatility').then(load),
  STDDEV: () => import('./volatility/standardDeviation').then(load),
  CV:     () => import('./volatility/chaikinVolatility').then(load),
  MI:     () => import('./volatility/massIndex').then(load),
  UI:     () => import('./volatility/ulcerIndex').then(load),
  BBW:    () => import('./volatility/bollingerBandWidth').then(load),
  StandardError: () => import('./volatility/standardError').then(load),
  // Volume
  VWAP:      () => import('./volume/vwap').then(load),
  MFI:       () => import('./volume/mfi').then(load),
  CMF:       () => import('./volume/chaikinMoneyFlow').then(load),
  AD:        () => import('./volume/adLine').then(load),
  VROC:      () => import('./volume/vroc').then(load),
  KVO:       () => import('./volume/klingerOscillator').then(load),
  FI:        () => import('./volume/forceIndex').then(load),
  ELDER_RAY:        () => import('./volume/elderRay').then(load),
  VolumeOscillator: () => import('./volume/volumeOscillator').then(load),
  // Momentum
  StochRSI: () => import('./momentum/stochasticRsi').then(load),
  ADX:      () => import('./momentum/adx').then(load),
  AROON:    () => import('./momentum/aroon').then(load),
  UO:       () => import('./momentum/ultimateOscillator').then(load),
  FISHER:   () => import('./momentum/fisherTransform').then(load),
  COPPOCK:  () => import('./momentum/coppockCurve').then(load),
  PPO:      () => import('./momentum/ppo').then(load),
  DPO:      () => import('./momentum/dpo').then(load),
  KST:      () => import('./momentum/kst').then(load),
  TMF:      () => import('./momentum/twiggsMf').then(load),
  ConnorsRSI:           () => import('./momentum/connorsRsi').then(load),
  EhlersLeading:        () => import('./momentum/ehlersLeadingIndicator').then(load),
  WilliamsR:            () => import('./momentum/williamsR').then(load),
  // Other
  PIVOTPOINTS:            () => import('./other/pivotPoints').then(load),
  ZIGZAG:                 () => import('./other/zigzag').then(load),
  CorrelationCoefficient: () => import('./other/correlationCoefficient').then(load),
  VOLUME_PROFILE:         () => import('./other/volumeProfile').then(load),
}
