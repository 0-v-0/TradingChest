/**
 * 图表类型扩展入口
 * 汇总所有自定义图表类型（以指标形式注册），统一导出供主入口注册使用
 */
import baseline from './baseline'
import heikinAshi from './heikinAshi'
import renko from './renko'

const chartTypes = [heikinAshi, baseline, renko]
export default chartTypes
