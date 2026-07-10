/**
 * 动量类技术指标集合
 *
 * 包含 10 个动量指标：
 * - StochRSI: 随机相对强弱指数
 * - ADX: 平均趋向指数
 * - Aroon: 阿隆指标
 * - UO: 终极震荡指标
 * - Fisher: 费舍尔变换
 * - Coppock: 估波指标
 * - PPO: 百分比价格振荡器
 * - DPO: 去趋势价格振荡器
 * - KST: 确然指标
 * - TMF: 特威格斯资金流
 */
import adx from './adx'
import aroon from './aroon'
import coppockCurve from './coppockCurve'
import dpo from './dpo'
import fisherTransform from './fisherTransform'
import kst from './kst'
import ppo from './ppo'
import stochasticRsi from './stochasticRsi'
import twiggsMf from './twiggsMf'
import ultimateOscillator from './ultimateOscillator'

const momentumIndicators = [
  stochasticRsi,
  adx,
  aroon,
  ultimateOscillator,
  fisherTransform,
  coppockCurve,
  ppo,
  dpo,
  kst,
  twiggsMf,
]

export default momentumIndicators
