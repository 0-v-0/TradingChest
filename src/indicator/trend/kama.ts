/**
 * KAMA - 考夫曼自适应移动平均线
 * 根据市场效率比率（ER）动态调整平滑常数
 * 趋势明显时响应快，震荡时响应慢
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type KamaResult = { kama: number }

const kama: IndicatorTemplate<KamaResult, number> = {
  name: 'KAMA',
  shortName: 'KAMA',
  calcParams: [10, 2, 30],
  figures: [{ key: 'kama', title: 'KAMA: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period, fastPeriod, slowPeriod] }) => {
    const n = dataList.length

    // 快速与慢速平滑常数
    const fastSc = 2 / (fastPeriod + 1)
    const slowSc = 2 / (slowPeriod + 1)

    const result: KamaResult[] = new Array(n)
    let prevKama = 0
    let volSum = 0
    let prevClose = NaN

    for (let i = 0; i < n; i++) {
      const close = Number(dataList[i].close)
      let kama = NaN

      if (i >= 1 && Number.isFinite(prevClose)) {
        volSum += Math.abs(close - prevClose)
      }
      if (i > period) {
        const outClose = Number(dataList[i - period - 1].close)
        const enteringDiff = Math.abs(Number(dataList[i - period].close) - outClose)
        volSum -= enteringDiff
      }
      prevClose = close

      if (i < period) {
        // 数据不足，KAMA 初始值取第 period 根 K 线的收盘价
        if (i === period - 1) {
          prevKama = close
          kama = prevKama
        }
      } else {
        const startClose = Number(dataList[i - period].close)
        const direction = Math.abs(close - startClose)
        const er = volSum !== 0 ? direction / volSum : 0
        const sc = Math.pow(er * (fastSc - slowSc) + slowSc, 2)
        prevKama = prevKama + sc * (close - prevKama)
        kama = prevKama
      }
      result[i] = { kama }
    }

    return result
  },
}

export default kama
