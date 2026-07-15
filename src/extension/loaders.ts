import type { OverlayTemplate } from 'klinecharts'

type OverlayLoader = () => Promise<OverlayTemplate>

const load = <D, C>(m: { default: OverlayTemplate }): OverlayTemplate =>
  m.default as unknown as OverlayTemplate

// oxfmt-ignore
export const overlayLoaders: Record<string, OverlayLoader> = {
  arrow:             () => import('./arrow').then(load),
  circle:            () => import('./circle').then(load),
  rect:              () => import('./rect').then(load),
  triangle:          () => import('./triangle').then(load),
  parallelogram:     () => import('./parallelogram').then(load),
  fibonacciCircle:   () => import('./fibonacciCircle').then(load),
  fibonacciSegment:  () => import('./fibonacciSegment').then(load),
  fibonacciSpiral:   () => import('./fibonacciSpiral').then(load),
  fibonacciSpeedResistanceFan: () => import('./fibonacciSpeedResistanceFan').then(load),
  fibonacciExtension: () => import('./fibonacciExtension').then(load),
  gannBox:           () => import('./gannBox').then(load),
  threeWaves:        () => import('./threeWaves').then(load),
  fiveWaves:         () => import('./fiveWaves').then(load),
  eightWaves:        () => import('./eightWaves').then(load),
  anyWaves:          () => import('./anyWaves').then(load),
  abcd:              () => import('./abcd').then(load),
  xabcd:             () => import('./xabcd').then(load),
  priceRange:        () => import('./priceRange').then(load),
  dateRange:         () => import('./dateRange').then(load),
  dateAndPriceRange: () => import('./dateAndPriceRange').then(load),
  disjointAngle:     () => import('./disjointAngle').then(load),
  pitchfork:         () => import('./pitchfork').then(load),
  schiffPitchfork:   () => import('./schiffPitchfork').then(load),
  regressionTrend:   () => import('./regressionTrend').then(load),
  regressionChannel: () => import('./regressionChannel').then(load),
  textAnnotation:    () => import('./textAnnotation').then(load),
  callout:           () => import('./callout').then(load),
  brush:             () => import('./brush').then(load),
  longPosition:      () => import('./longPosition').then(load),
  shortPosition:     () => import('./shortPosition').then(load),
  note:              () => import('./note').then(load),
  positionRange:     () => import('./positionRange').then(load),
  tradeMarker:       () => import('./tradeMarker').then(load),
  alertLine:         () => import('../alert/AlertLine').then(load),
  flatTopBottom:     () => import('./flatTopBottom').then(load),
  forecast:          () => import('./forecast').then(load),
}
