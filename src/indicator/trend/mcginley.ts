/**
 * McGinley Dynamic - 麦金利动态指标
 * MD = MD_prev + (close - MD_prev) / (N * (close / MD_prev)^4)
 * 自动调整速度以适应市场节奏，避免大部分均线的假突破问题
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'

type McginleyResult = { md: number | undefined }

const mcginley: IndicatorTemplate = {
  name: 'MCGINLEY',
  shortName: 'McGinley',
  calcParams: [14],
  figures: [{ key: 'md', title: 'MD: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const params = indicator.calcParams
    const period = params[0] as number

    const result: McginleyResult[] = []
    let prevMd = 0

    for (let i = 0; i < dataList.length; i++) {
      const close = dataList[i].close

      let md = undefined
      if (i === 0) {
        // 初始值使用第一根 K 线的收盘价
        prevMd = close
      } else {
        // MD = MD_prev + (close - MD_prev) / (N * (close / MD_prev)^4)
        prevMd = prevMd + (close - prevMd) / (period * Math.pow(close / prevMd, 4))
        if (i >= period - 1) {
          md = prevMd
        }
      }
      result.push({ md })
    }

    return result
  },
}

export default mcginley
