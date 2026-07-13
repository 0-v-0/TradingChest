/**
 * McGinley Dynamic - 麦金利动态指标
 * MD = MD_prev + (close - MD_prev) / (N * (close / MD_prev)^4)
 * 自动调整速度以适应市场节奏，避免大部分均线的假突破问题
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type McginleyResult = { md: number }

const mcginley: IndicatorTemplate<McginleyResult, number> = {
  name: 'MCGINLEY',
  shortName: 'McGinley',
  calcParams: [14],
  figures: [{ key: 'md', title: 'MD: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [period] }) => {
    const n = dataList.length

    const result: McginleyResult[] = new Array(n)
    let prevMd = 0

    for (let i = 0; i < n; i++) {
      const close = dataList[i].close

      let md = NaN
      if (i === 0) {
        // 初始值使用第一根 K 线的收盘价
        prevMd = close
      } else if (prevMd === 0 || close === 0) {
        // Guard: division by zero in (close / prevMd)^4 when either is 0
        md = NaN
      } else {
        // MD = MD_prev + (close - MD_prev) / (N * (close / MD_prev)^4)
        prevMd = prevMd + (close - prevMd) / (period * Math.pow(close / prevMd, 4))
        if (i >= period - 1) {
          md = prevMd
        }
      }
      result[i] = { md }
    }

    return result
  },
}

export default mcginley
