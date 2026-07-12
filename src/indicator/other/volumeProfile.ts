import type { IndicatorTemplate, KLineData } from 'klinecharts'

export interface VolumeBin {
  priceHigh: number
  priceLow: number
  volume: number
}

export interface VolumeProfileResult {
  bins: VolumeBin[]
  pocIndex: number
  totalVolume: number
  vaLow: number
  vaHigh: number
}

const DEFAULT_BINS = 24

function calcVolumeProfile(dataList: KLineData[], numBins: number): VolumeProfileResult {
  let maxPrice = -Infinity
  let minPrice = Infinity

  for (const k of dataList) {
    if (k.high > maxPrice) maxPrice = k.high
    if (k.low < minPrice) minPrice = k.low
  }

  const range = maxPrice - minPrice
  const binSize = range / numBins
  const bins: VolumeBin[] = Array.from({ length: numBins }, (_, i) => ({
    priceLow: minPrice + i * binSize,
    priceHigh: minPrice + (i + 1) * binSize,
    volume: 0,
  }))

  for (const k of dataList) {
    const vol = k.volume ?? 0
    if (vol === 0) continue
    const startBin = Math.max(0, Math.min(numBins - 1, Math.floor((k.low - minPrice) / binSize)))
    const endBin = Math.max(0, Math.min(numBins - 1, Math.floor((k.high - minPrice) / binSize)))
    const span = endBin - startBin + 1
    const volPerBin = vol / span
    for (let i = startBin; i <= endBin; i++) {
      bins[i].volume += volPerBin
    }
  }

  let pocIndex = 0
  let maxVol = 0
  for (let i = 0; i < bins.length; i++) {
    if (bins[i].volume > maxVol) {
      maxVol = bins[i].volume
      pocIndex = i
    }
  }

  const totalVolume = bins.reduce((s, b) => s + b.volume, 0)
  let vaLow = pocIndex
  let vaHigh = pocIndex
  let vaVolume = bins[pocIndex].volume
  const vaTarget = totalVolume * 0.7
  while (vaVolume < vaTarget) {
    const leftVol = vaLow > 0 ? bins[vaLow - 1].volume : 0
    const rightVol = vaHigh < numBins - 1 ? bins[vaHigh + 1].volume : 0
    if (leftVol >= rightVol && vaLow > 0) {
      vaLow--
      vaVolume += leftVol
    } else if (rightVol > 0 && vaHigh < numBins - 1) {
      vaHigh++
      vaVolume += rightVol
    } else {
      break
    }
  }

  return { bins, pocIndex, totalVolume, vaLow, vaHigh }
}

const volumeProfile: IndicatorTemplate = {
  name: 'VOLUME_PROFILE',
  shortName: 'VP',
  calcParams: [DEFAULT_BINS],
  series: 'price',
  figures: [{ key: 'vp', title: 'VP: ', type: 'line' }],
  calc: (dataList: KLineData[], indicator) => {
    const numBins = (indicator.calcParams[0] as number) || DEFAULT_BINS
    const result = calcVolumeProfile(dataList, numBins)
    return Array(dataList.length).fill({ vp: undefined }).map((v, i) => {
      if (i === 0) return { vp: result.bins[result.pocIndex]?.priceLow ?? 0, __vp: result }
      return v
    })
  },
  draw: ({ ctx, indicator, bounding, yAxis }) => {
    const result = indicator.result?.[0] as ({ vp: number } & { __vp?: VolumeProfileResult }) | undefined
    if (!result?.__vp) return true
    const vp = result.__vp
    const maxV = vp.bins.reduce((s, b) => Math.max(s, b.volume), 0)
    if (maxV === 0) return true

    const leftMargin = 8

    for (let i = 0; i < vp.bins.length; i++) {
      const bin = vp.bins[i]
      const y1 = yAxis.convertToPixel(bin.priceHigh)
      const y2 = yAxis.convertToPixel(bin.priceLow)
      const yTop = Math.min(y1, y2)
      const barH = Math.max(2, Math.abs(y2 - y1))

      const barLen = (bin.volume / maxV) * 120

      const isPoc = i === vp.pocIndex
      const inVa = i >= vp.vaLow && i <= vp.vaHigh

      ctx.fillStyle = isPoc ? '#e74c3c' : inVa ? 'rgba(52, 152, 219, 0.5)' : 'rgba(149, 165, 166, 0.3)'
      ctx.fillRect(bounding.right - leftMargin - barLen, yTop, barLen, barH)
    }

    return true
  },
}

export { calcVolumeProfile }
export default volumeProfile