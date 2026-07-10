/**
 * 做多持仓可视化覆盖工具
 * 三次点击：入场价、止损价、止盈价
 * 绘制三个区域：
 *   - 绿色区域：入场到止盈（入场上方）
 *   - 红色区域：入场到止损（入场下方）
 *   - 入场价水平线
 * 显示盈亏比文字
 */

import { createPositionOverlay } from './positionUtils'

export default createPositionOverlay('longPosition', 'long')
