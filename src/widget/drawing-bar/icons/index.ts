/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from 'solid-js'

import horizontalStraightLine from './horizontalStraightLine'
import horizontalRayLine from './horizontalRayLine'
import horizontalSegment from './horizontalSegment'
import verticalStraightLine from './verticalStraightLine'
import verticalRayLine from './verticalRayLine'
import verticalSegment from './verticalSegment'
import straightLine from './straightLine'
import rayLine from './rayLine'
import segment from './segment'
import arrow from './arrow'
import priceLine from './priceLine'
import priceChannelLine from './priceChannelLine'
import parallelStraightLine from './parallelStraightLine'
import fibonacciLine from './fibonacciLine'
import fibonacciSegment from './fibonacciSegment'
import fibonacciCircle from './fibonacciCircle'
import fibonacciSpiral from './fibonacciSpiral'
import fibonacciSpeedResistanceFan from './fibonacciSpeedResistanceFan'
import fibonacciExtension from './fibonacciExtension'
import gannBox from './gannBox'
import circle from './circle'
import triangle from './triangle'
import rect from './rect'
import parallelogram from './parallelogram'
import threeWaves from './threeWaves'
import fiveWaves from './fiveWaves'
import eightWaves from './eightWaves'
import anyWaves from './anyWaves'
import abcd from './abcd'
import xabcd from './xabcd'
import pitchfork from './pitchfork'
import schiffPitchfork from './schiffPitchfork'
import regressionTrend from './regressionTrend'
import regressionChannel from './regressionChannel'
import priceRange from './priceRange'
import dateRange from './dateRange'
import dateAndPriceRange from './dateAndPriceRange'
import textAnnotation from './textAnnotation'
import callout from './callout'
import brush from './brush'
import longPosition from './longPosition'
import shortPosition from './shortPosition'
import note from './note'

import weakMagnet from './weakMagnet'
import strongMagnet from './strongMagnet'

import visible from './visible'
import invisible from './invisible'

import lock from './lock'
import unlock from './unlock'

import remove from './remove'

import type { SelectDataSourceItem } from '../../../component'

import t from '../../../i18n'

export const mapping = {
  horizontalStraightLine,
  horizontalRayLine,
  horizontalSegment,
  verticalStraightLine,
  verticalRayLine,
  verticalSegment,
  straightLine,
  rayLine,
  segment,
  arrow,
  priceLine,
  priceChannelLine,
  parallelStraightLine,
  fibonacciLine,
  fibonacciSegment,
  fibonacciCircle,
  fibonacciSpiral,
  fibonacciSpeedResistanceFan,
  fibonacciExtension,
  gannBox,
  circle,
  triangle,
  rect,
  parallelogram,
  threeWaves,
  fiveWaves,
  eightWaves,
  anyWaves,
  abcd,
  xabcd,
  pitchfork,
  schiffPitchfork,
  regressionTrend,
  regressionChannel,
  priceRange,
  dateRange,
  dateAndPriceRange,
  textAnnotation,
  callout,
  brush,
  longPosition,
  shortPosition,
  note,
  weak_magnet: weakMagnet,
  strong_magnet: strongMagnet,
  lock,
  unlock,
  visible,
  invisible,
  remove
}

export function createSingleLineOptions (locale: string): SelectDataSourceItem[] {
  return  [
    { key: 'horizontalStraightLine', text: t('horizontal_straight_line', locale) },
    { key: 'horizontalRayLine', text: t('horizontal_ray_line', locale) },
    { key: 'horizontalSegment', text: t('horizontal_segment', locale) },
    { key: 'verticalStraightLine', text: t('vertical_straight_line', locale) },
    { key: 'verticalRayLine', text: t('vertical_ray_line', locale) },
    { key: 'verticalSegment', text: t('vertical_segment', locale) },
    { key: 'straightLine', text: t('straight_line', locale) },
    { key: 'rayLine', text: t('ray_line', locale) },
    { key: 'segment', text: t('segment', locale) },
    { key: 'arrow', text: t('arrow', locale) },
    { key: 'priceLine', text: t('price_line', locale) }
  ]
}

export function createMoreLineOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'priceChannelLine', text: t('price_channel_line', locale) },
    { key: 'parallelStraightLine', text: t('parallel_straight_line', locale) }
  ]
}

export function createPolygonOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'circle', text: t('circle', locale) },
    { key: 'rect', text: t('rect', locale) },
    { key: 'parallelogram', text: t('parallelogram', locale) },
    { key: 'triangle', text: t('triangle', locale) }
  ]
}

export function createFibonacciOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'fibonacciLine', text: t('fibonacci_line', locale) },
    { key: 'fibonacciSegment', text: t('fibonacci_segment', locale) },
    { key: 'fibonacciCircle', text: t('fibonacci_circle', locale) },
    { key: 'fibonacciSpiral', text: t('fibonacci_spiral', locale) },
    { key: 'fibonacciSpeedResistanceFan', text: t('fibonacci_speed_resistance_fan', locale) },
    { key: 'fibonacciExtension', text: t('fibonacci_extension', locale) },
    { key: 'gannBox', text: t('gann_box', locale) }
  ]
}

export function createWaveOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'xabcd', text: t('xabcd', locale) },
    { key: 'abcd', text: t('abcd', locale) },
    { key: 'threeWaves', text: t('three_waves', locale) },
    { key: 'fiveWaves', text: t('five_waves', locale) },
    { key: 'eightWaves', text: t('eight_waves', locale) },
    { key: 'anyWaves', text: t('any_waves', locale) },
  ]
}

export function createMeasurementOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'priceRange', text: t('price_range', locale) },
    { key: 'dateRange', text: t('date_range', locale) },
    { key: 'dateAndPriceRange', text: t('date_and_price_range', locale) }
  ]
}

export function createChannelOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'pitchfork', text: t('pitchfork', locale) },
    { key: 'schiffPitchfork', text: t('schiff_pitchfork', locale) },
    { key: 'regressionTrend', text: t('regression_trend', locale) },
    { key: 'regressionChannel', text: t('regression_channel', locale) }
  ]
}

export function createAnnotationOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'textAnnotation', text: t('text_annotation', locale) },
    { key: 'callout', text: t('callout', locale) },
    { key: 'note', text: t('note', locale) },
    { key: 'brush', text: t('brush', locale) }
  ]
}

export function createPositionOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'longPosition', text: t('long_position', locale) },
    { key: 'shortPosition', text: t('short_position', locale) }
  ]
}

export function createMagnetOptions (locale: string): SelectDataSourceItem[] {
  return [
    { key: 'weak_magnet', text: t('weak_magnet', locale) },
    { key: 'strong_magnet', text: t('strong_magnet', locale) }
  ]
}

interface IconProps {
  class?: string
  name: string
}

// @ts-expect-error — mapping keys are fixed icon names but props.name is a dynamic string
export const Icon: Component<IconProps> = props => mapping[props.name](props.class)
