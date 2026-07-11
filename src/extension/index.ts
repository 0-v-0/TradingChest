import alertLine from '../alert/AlertLine'
import abcd from './abcd'
import anyWaves from './anyWaves'
import arrow from './arrow'
import brush from './brush'
import callout from './callout'
import circle from './circle'
import dateAndPriceRange from './dateAndPriceRange'
import disjointAngle from './disjointAngle'
import dateRange from './dateRange'
import eightWaves from './eightWaves'
import fibonacciCircle from './fibonacciCircle'
import fibonacciExtension from './fibonacciExtension'
import fibonacciSegment from './fibonacciSegment'
import fibonacciSpeedResistanceFan from './fibonacciSpeedResistanceFan'
import fibonacciSpiral from './fibonacciSpiral'
import fiveWaves from './fiveWaves'
import flatTopBottom from './flatTopBottom'
import forecast from './forecast'
import gannBox from './gannBox'
import longPosition from './longPosition'
import note from './note'
import parallelogram from './parallelogram'
import pitchfork from './pitchfork'
import positionRange from './positionRange'
import priceRange from './priceRange'
import rect from './rect'
import regressionChannel from './regressionChannel'
import regressionTrend from './regressionTrend'
import schiffPitchfork from './schiffPitchfork'
import shortPosition from './shortPosition'
import textAnnotation from './textAnnotation'
import threeWaves from './threeWaves'
import tradeMarker from './tradeMarker'
import triangle from './triangle'
import xabcd from './xabcd'

// oxfmt-ignore
const overlays = [
  arrow,
  circle, rect, triangle, parallelogram,
  fibonacciCircle, fibonacciSegment, fibonacciSpiral,
  fibonacciSpeedResistanceFan, fibonacciExtension, gannBox,
  threeWaves, fiveWaves, eightWaves, anyWaves, abcd, xabcd,
  priceRange, dateRange, dateAndPriceRange, disjointAngle,
  pitchfork, schiffPitchfork, regressionTrend, regressionChannel,
  textAnnotation, callout, brush, longPosition, shortPosition, note,
  positionRange,
  tradeMarker,
  alertLine,
  flatTopBottom,
  forecast,
]

export default overlays
