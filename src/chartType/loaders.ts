import type { IndicatorTemplate } from 'klinecharts'

type ChartTypeLoader = () => Promise<IndicatorTemplate>

const load = <D, C>(m: { default: IndicatorTemplate<D, C> }): IndicatorTemplate =>
  m.default as unknown as IndicatorTemplate

// oxfmt-ignore
export const chartTypeLoaders: Record<string, ChartTypeLoader> = {
  heikinAshi:     () => import('./heikinAshi').then(load),
  baseline:       () => import('./baseline').then(load),
  renko:          () => import('./renko').then(load),
  kagi:           () => import('./kagi').then(load),
  pointAndFigure: () => import('./pointAndFigure').then(load),
  lineBreak:      () => import('./lineBreak').then(load),
  rangeBars:      () => import('./rangeBars').then(load),
}
