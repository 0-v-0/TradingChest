/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific locale governing permissions and
 * limitations under the License.
 */

import t from '../../i18n'

export interface SettingOption {
  key: string
  text: string
  component: 'select' | 'switch' | 'color'
  dataSource?: Array<{ key: string; text: string }>
}

export interface SettingGroup {
  label: string
  options: SettingOption[]
}

export function getOptions(locale: string): SettingGroup[] {
  return [
    {
      label: t('group_candle', locale),
      options: [
        {
          key: 'candle.type',
          text: t('candle_type', locale),
          component: 'select',
          dataSource: [
            { key: 'candle_solid', text: t('candle_solid', locale) },
            { key: 'candle_stroke', text: t('candle_stroke', locale) },
            { key: 'candle_up_stroke', text: t('candle_up_stroke', locale) },
            { key: 'candle_down_stroke', text: t('candle_down_stroke', locale) },
            { key: 'ohlc', text: t('ohlc', locale) },
            { key: 'area', text: t('area', locale) },
            { key: 'heikin_ashi', text: t('heikin_ashi', locale) },
            { key: 'baseline', text: t('baseline', locale) },
            { key: 'Renko', text: t('renko', locale) },
            { key: 'Kagi', text: t('kagi', locale) },
            { key: 'PointAndFigure', text: t('point_and_figure', locale) },
            { key: 'LineBreak', text: t('line_break', locale) },
            { key: 'RangeBars', text: t('range_bars', locale) },
          ],
        },
        {
          key: 'candle.bar.upColor',
          text: t('candle_up_color', locale),
          component: 'color',
        },
        {
          key: 'candle.bar.downColor',
          text: t('candle_down_color', locale),
          component: 'color',
        },
        {
          key: 'candle.priceMark.last.show',
          text: t('last_price_show', locale),
          component: 'switch',
        },
        {
          key: 'candle.priceMark.high.show',
          text: t('high_price_show', locale),
          component: 'switch',
        },
        {
          key: 'candle.priceMark.low.show',
          text: t('low_price_show', locale),
          component: 'switch',
        },
        {
          key: 'candle.tooltip.showType',
          text: t('tooltip_show_type', locale),
          component: 'select',
          dataSource: [
            { key: 'standard', text: t('tooltip_standard', locale) },
            { key: 'rect', text: t('tooltip_rect', locale) },
          ],
        },
      ],
    },
    {
      label: t('group_axis', locale),
      options: [
        {
          key: 'yAxis.reverse',
          text: t('reverse_coordinate', locale),
          component: 'switch',
        },
        {
          key: 'indicator.lastValueMark.show',
          text: t('indicator_last_value_show', locale),
          component: 'switch',
        },
      ],
    },
    {
      label: t('group_grid_crosshair', locale),
      options: [
        {
          key: 'grid.show',
          text: t('grid_show', locale),
          component: 'switch',
        },
        {
          key: 'crosshair.show',
          text: t('crosshair_show', locale),
          component: 'switch',
        },
        {
          key: 'crosshair.horizontal.show',
          text: t('crosshair_horizontal_show', locale),
          component: 'switch',
        },
        {
          key: 'crosshair.vertical.show',
          text: t('crosshair_vertical_show', locale),
          component: 'switch',
        },
      ],
    },
  ]
}
