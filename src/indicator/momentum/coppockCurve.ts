/**
 * Coppock Curve - 估波指标
 *
 * Edwin Coppock 设计的长期动量指标，用于识别市场底部。
 * Coppock = WMA(ROC(close, roc1Period) + ROC(close, roc2Period), wmaPeriod)
 * 其中 ROC(x, n) = (x / x[n周期前] - 1) * 100
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcWMA } from '../utils'

type CoppockCurveResult = { coppock: number }

const coppockCurve: IndicatorTemplate<CoppockCurveResult, number> = {
  name: 'COPPOCK',
  shortName: 'Coppock',
  calcParams: [14, 11, 10],
  figures: [{ key: 'coppock', title: 'Coppock: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [roc1Period, roc2Period, wmaPeriod] }) => {
    const len = dataList.length
    const result: CoppockCurveResult[] = new Array(len)

    // 需要足够的历史数据来计算 ROC
    const maxRocPeriod = Math.max(roc1Period, roc2Period)

    // 计算两条 ROC 之和
    const rocSum: number[] = new Array<number>(len).fill(NaN)
    for (let i = maxRocPeriod; i < len; i++) {
      const closeNow = dataList[i].close
      const close1 = dataList[i - roc1Period].close
      const close2 = dataList[i - roc2Period].close

      // 防除零
      if (close1 === 0 || close2 === 0) continue

      const roc1 = (closeNow / close1 - 1) * 100
      const roc2 = (closeNow / close2 - 1) * 100
      rocSum[i] = roc1 + roc2
    }

    // 对 rocSum 做 WMA
    const wmaResult = calcWMA(rocSum, wmaPeriod)

    for (let i = 0; i < len; i++) {
      result[i] = { coppock: wmaResult[i] }
    }

    return result
  },
}

export default coppockCurve
