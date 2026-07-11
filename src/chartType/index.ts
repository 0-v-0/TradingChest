/**
 * 图表类型扩展入口
 * 汇总所有自定义图表类型（以指标形式注册），统一导出供主入口注册使用
 */
import baseline from './baseline'
import heikinAshi from './heikinAshi'
import renko from './renko'
import kagi from './kagi'
import pointAndFigure from './pointAndFigure'
import lineBreak from './lineBreak'
import rangeBars from './rangeBars'

const chartTypes = [heikinAshi, baseline, renko, kagi, pointAndFigure, lineBreak, rangeBars]
export default chartTypes
