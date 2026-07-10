/**
 * Standard Deviation - 标准差
 * 收盘价在回看窗口内的总体标准差
 */
import { IndicatorTemplate, KLineData } from 'klinecharts'

type StandardDeviationResult = { stddev: number | undefined }

const standardDeviation: IndicatorTemplate = {
  name: 'STDDEV',
  shortName: 'StdDev',
  calcParams: [20],
  figures: [{ key: 'stddev', title: 'STDDEV: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number
    const result: StandardDeviationResult[] = []

    for (let i = 0; i < dataList.length; i++) {
      let stddev = undefined
      if (i >= period - 1) {
        // 计算窗口内收盘价的均值
        let sum = 0
        for (let j = i - period + 1; j <= i; j++) {
          sum += dataList[j].close
        }
        const mean = sum / period

        // 计算总体方差（除以 n）
        let varianceSum = 0
        for (let j = i - period + 1; j <= i; j++) {
          const diff = dataList[j].close - mean
          varianceSum += diff * diff
        }
        stddev = Math.sqrt(varianceSum / period)
      }
      result.push({ stddev })
    }
    return result
  },
}

export default standardDeviation
