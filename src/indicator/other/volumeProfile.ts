import type { IndicatorTemplate, KLineData } from 'klinecharts'

export interface VolumeBin {
  priceHigh: number
  priceLow: number
  volume: number
}

export interface VolumeProfileData {
  bins: VolumeBin[]
  pocIndex: number
  totalVolume: number
  vaLow: number
  vaHigh: number
}

interface VolumeProfileResult {
  vp: number
  __vp?: VolumeProfileData
}

const DEFAULT_BINS = 24

function calcVolumeProfile(dataList: KLineData[], numBins: number): VolumeProfileData {
  let maxPrice = -Infinity
  let minPrice = Infinity

  for (const k of dataList) {
    if (k.high > maxPrice) maxPrice = k.high
    if (k.low < minPrice) minPrice = k.low
  }

  const range = maxPrice - minPrice
  // Guard against flat market (all highs === all lows) — avoid division by zero
  const binSize = range > 0 ? range / numBins : 1
  const bins: VolumeBin[] = Array.from({ length: numBins }, (_, i) => ({
    priceLow: minPrice + i * binSize,
    priceHigh: minPrice + (i + 1) * binSize,
    volume: 0,
  }))

  for (const k of dataList) {
    const vol = k.volume ?? 0
    if (vol === 0) continue
    // When range === 0, all prices fall into the first bin
    const startBin = range > 0
      ? Math.max(0, Math.min(numBins - 1, Math.floor((k.low - minPrice) / binSize)))
      : 0
    const endBin = range > 0
      ? Math.max(0, Math.min(numBins - 1, Math.floor((k.high - minPrice) / binSize)))
      : numBins - 1
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

const volumeProfile: IndicatorTemplate<VolumeProfileResult, number> = {
  name: 'VOLUME_PROFILE',
  shortName: 'VP',
  calcParams: [DEFAULT_BINS],
  series: 'price',
  figures: [{ key: 'vp', title: 'VP: ', type: 'line' }],
  calc: (dataList: KLineData[], { calcParams: [numBins = DEFAULT_BINS] }) => {
    const n = dataList.length
    const result = calcVolumeProfile(dataList, numBins)
    const arr: VolumeProfileResult[] = new Array(n)
    for (let i = 0; i < n; i++) {
      arr[i] = i === 0
        ? { vp: result.bins[result.pocIndex]?.priceLow ?? 0, __vp: result }
        : { vp: NaN }
    }
    return arr
  },
  draw: ({ ctx, indicator, bounding, yAxis }) => {
    const result = indicator.result?.[0]
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