import alligator from './alligator'
/**
 * 趋势类指标集合
 * 包含 ATR、SuperTrend、Ichimoku、Alligator 等 15 个趋势指标
 */
import atr from './atr'
import dema from './dema'
import envelopes from './envelopes'
import hma from './hma'
import ichimoku from './ichimoku'
import kama from './kama'
import linearRegression from './linearRegression'
import mcginley from './mcginley'
import superTrend from './superTrend'
import t3 from './t3'
import tema from './tema'
import vwma from './vwma'
import wma from './wma'
import zlema from './zlema'

const trendIndicators = [
  atr,
  superTrend,
  ichimoku,
  alligator,
  dema,
  tema,
  wma,
  hma,
  kama,
  vwma,
  zlema,
  mcginley,
  linearRegression,
  envelopes,
  t3,
]

export default trendIndicators
