/**
 * 成交量类技术指标集合
 * 包含 VWAP、MFI、CMF、AD、VROC、KVO、FI、Elder Ray
 */
import adLine from './adLine'
import chaikinMoneyFlow from './chaikinMoneyFlow'
import elderRay from './elderRay'
import forceIndex from './forceIndex'
import klingerOscillator from './klingerOscillator'
import mfi from './mfi'
import vroc from './vroc'
import vwap from './vwap'

const volumeIndicators = [
  vwap,
  mfi,
  chaikinMoneyFlow,
  adLine,
  vroc,
  klingerOscillator,
  forceIndex,
  elderRay,
]

export default volumeIndicators
