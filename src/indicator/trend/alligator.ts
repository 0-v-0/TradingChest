/**
 * Williams Alligator - 威廉鳄鱼指标
 * 由鳄鱼颚（Jaw）、牙齿（Teeth）、嘴唇（Lips）三条平滑移动均线组成
 * 各线有不同的周期和前移偏移量
 */
import type { IndicatorTemplate, KLineData } from 'klinecharts'
import { calcRMA } from '../utils'

type AlligatorResult = {
  jaw: number
  teeth: number
  lips: number
}

const alligator: IndicatorTemplate<AlligatorResult, number> = {
  name: 'ALLIGATOR',
  shortName: 'Alligator',
  calcParams: [13, 8, 5],
  figures: [
    { key: 'jaw', title: '颚线: ', type: 'line' },
    { key: 'teeth', title: '齿线: ', type: 'line' },
    { key: 'lips', title: '唇线: ', type: 'line' },
  ],
  calc: (dataList: KLineData[], { calcParams: [jawPeriod, teethPeriod, lipsPeriod] }) => {
    const n = dataList.length

    const jawOffset = 8
    const teethOffset = 5
    const lipsOffset = 3

    const median = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      median[i] = (dataList[i].high + dataList[i].low) / 2
    }

    const jawSmma = calcRMA(median, jawPeriod)
    const teethSmma = calcRMA(median, teethPeriod)
    const lipsSmma = calcRMA(median, lipsPeriod)

    const result: AlligatorResult[] = new Array(n)

    for (let i = 0; i < n; i++) {
      const item: Partial<AlligatorResult> = {}

      const jawSrcIdx = i - jawOffset
      if (jawSrcIdx >= 0 && jawSrcIdx < n) {
        item.jaw = jawSmma[jawSrcIdx]
      }

      const teethSrcIdx = i - teethOffset
      if (teethSrcIdx >= 0 && teethSrcIdx < n) {
        item.teeth = teethSmma[teethSrcIdx]
      }

      const lipsSrcIdx = i - lipsOffset
      if (lipsSrcIdx >= 0 && lipsSrcIdx < n) {
        item.lips = lipsSmma[lipsSrcIdx]
      }

      result[i] = item as AlligatorResult
    }

    return result
  },
}

export default alligator
