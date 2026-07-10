/**
 * 做空持仓可视化覆盖工具
 * 三次点击：入场价、止损价、止盈价
 * 与 longPosition 反转：
 *   - 绿色区域：入场到止盈（入场下方）
 *   - 红色区域：入场到止损（入场上方）
 *   - 入场价水平线
 * 显示盈亏比文字
 */

import { createPositionOverlay } from './positionUtils'

export default createPositionOverlay('shortPosition', 'short')
