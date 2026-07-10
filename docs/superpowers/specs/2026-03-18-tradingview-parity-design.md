# TradingChest → TradingView 图表能力对标设计

> **Last updated**: 2026-07-10 | **Version**: 0.5.3

## 产品定位

TradingChest 定位为完全对标 TradingView 图表能力的开源交易图表库（不含数据、社区、脚本等平台能力），可高度自定义，不输于商业级产品。

## 架构基础

- **渲染引擎**: KLineChart 9.x（Canvas, 高性能, 30 内置指标, 14 内置 overlay）
- **UI 框架**: Solid.js（响应式, 轻量）
- **构建工具**: Vite 8（ESM + UMD 双格式输出）
- **包管理**: pnpm
- **类型系统**: TypeScript 6
- **测试框架**: Vitest 4 + @solidjs/testing-library
- **样式方案**: 原生 CSS（CSS nesting + CSS 变量, 无预处理器）
- **国际化**: INI 格式, 懒加载（zh-CN / en-US / ja / ko）
- **外部依赖**: klinecharts (peer), solid-js（lodash 已移除）

## 差距分析与实施路线

### Phase 1: 图表类型扩展（高优先级）

**现状**: 8 种（candle_solid, candle_stroke, candle_up_stroke, candle_down_stroke, ohlc, area, heikinAshi, baseline）
**目标**: 12+ 种

| 类型 | 状态 | 实现方式 |
|------|------|----------|
| Heikin Ashi | ✅ 已实现 | registerIndicator 数据转换 + 自定义渲染 |
| Baseline | ✅ 已实现 | 基于 area 扩展的双色区域图 |
| Renko | ❌ 未实现 | 纯价格砖形图, 忽略时间 |
| Kagi | ❌ 未实现 | 连续折线, 方向变化 |
| Point & Figure | ❌ 未实现 | X/O 列, 时间无关 |
| Line Break | ❌ 未实现 | 基于收盘价比较的新值线 |
| Hollow Candles | ⚠️ 已有 candle_stroke | 需 UI 暴露 |
| Range Bars | ❌ 未实现 | 等幅柱图 |

**剩余差距**: 4 种新图表类型 + 1 种 UI 暴露

### Phase 2: 技术指标扩展（高优先级）

**现状**: 38 个自定义指标 + 30 个引擎内置 = 68 个总计
**目标**: 80+ 个

| 类别 | 当前数量 | 指标列表 |
|------|----------|----------|
| **趋势** | 14 | ATR, SUPERTREND, ICHIMOKU, ALLIGATOR, DEMA, TEMA, WMA, HMA, KAMA, VWMA, ZLEMA, MCGINLEY, LINEARREGRESSION, ENVELOPES, T3 |
| **波动率** | 8 | KC, DC, HV, STDDEV, CV, MI, UI, BBW |
| **成交量** | 9 | VWAP, MFI, CMF, AD, VROC, KVO, FI, ELDER_RAY |
| **动量** | 11 | StochRSI, ADX, AROON, UO, FISHER, COPPOCK, PPO, DPO, KST, TMF |
| **其他** | 2 | PIVOTPOINTS, ZIGZAG |
| **交易** | 1 | TradeVis（交易记录可视化 + 点击检测） |

**剩余差距**: ~12 个指标（含引擎内置共需 80+）

待新增指标:
- **趋势**: McGinley Dynamic 已实现, 还需 Linear Regression Forecast
- **波动率**: Chaikin Volatility, Mass Index
- **成交量**: Accumulation/Distribution 已有(AD), Force Index 已有(FI)
- **动量**: Twiggs Money Flow 已有(TMF), 还需 Williams %R (WR, 引擎内置)
- **其他**: Fibonacci Pivot Points, Camarilla Pivot Points

### Phase 3: 绘图工具扩展（中优先级）

**现状**: 32 个自定义 overlay + 引擎内置 = ~45+ 总计
**目标**: 45+ 个 ✅ 已达标

| 类别 | 工具列表 |
|------|----------|
| **基础** | arrow, circle, rect, triangle, parallelogram |
| **斐波那契** | fibonacciCircle, fibonacciSegment, fibonacciSpiral, fibonacciSpeedResistanceFan, fibonacciExtension |
| **甘氏** | gannBox |
| **波浪** | threeWaves, fiveWaves, eightWaves, anyWaves |
| **形态** | abcd, xabcd |
| **测量** | priceRange, dateRange, dateAndPriceRange, positionRange |
| **通道** | pitchfork, schiffPitchfork, regressionTrend, regressionChannel |
| **标注** | textAnnotation, callout, brush, note |
| **交易** | longPosition, shortPosition, tradeMarker |
| **告警** | alertLine |

**Phase 3 原计划中已实现的工具**:
- ✅ Andrew's Pitchfork → pitchfork
- ✅ Schiff Pitchfork → schiffPitchfork
- ✅ Text Annotation → textAnnotation
- ✅ Callout → callout
- ✅ Price Range → priceRange
- ✅ Date Range → dateRange
- ✅ Price & Date Range → dateAndPriceRange
- ✅ Brush → brush
- ✅ Regression Trend → regressionTrend
- ✅ Regression Channel → regressionChannel
- ✅ Long Position → longPosition
- ✅ Short Position → shortPosition
- ✅ Note → note

**Phase 3 原计划中未实现的工具**:
- ❌ Flat Top/Bottom — 平顶/平底形态
- ❌ Disjoint Angle — 角度工具
- ❌ Forecast — 预测区间

### Phase 4: 键盘快捷键系统（高优先级）

**现状**: 16 个快捷键 ✅
**目标**: 完整快捷键体系

| 快捷键 | 动作 | 状态 |
|--------|------|------|
| Alt+T | 趋势线 | ✅ |
| Alt+F | 斐波那契回撤 | ✅ |
| Alt+H | 水平线 | ✅ |
| Alt+V | 垂直线 | ✅ |
| Alt+R | 矩形 | ✅ |
| Alt+B | 画笔 | ✅ |
| Alt+M | 测量工具 | ✅ |
| Escape | 取消绘制 | ✅ |
| Delete | 删除选中 | ✅ |
| Alt+S | 截图 | ✅ |
| Home | 滚动到开始 | ✅ |
| End | 滚动到最新 | ✅ |
| Ctrl++ | 放大 | ✅ |
| Ctrl+- | 缩小 | ✅ |
| Alt+C | 十字光标切换 | ✅ |
| Alt+G | 网格切换 | ✅ |
| Alt+L | 对数坐标切换 | ✅ |
| Ctrl+Z | 撤销 | ❌ (UndoRedoManager 已删除, 待重新设计) |
| Ctrl+Shift+Z | 重做 | ❌ (同上) |
| 自定义映射 | — | ✅ KeyboardShortcutManager 支持自定义绑定 |

### Phase 5: UI/UX 增强（高优先级）

| 功能 | 状态 | 备注 |
|------|------|------|
| 指标搜索 | ✅ 已实现 | 实时过滤 onInput |
| 指标收藏 | ❌ 未实现 | — |
| 绘图工具收藏 | ❌ 未实现 | — |
| 右键菜单 | ⚠️ 部分 | overlay 右键编辑已实现, 通用右键菜单未实现 |
| 数据窗口 | ❌ 未实现 | — |
| 图例改进 | ⚠️ 部分 | 可交互图例(显隐/设置/关闭), 无悬停高亮 |
| 指标参数设置 | ✅ 已实现 | indicator-setting-modal 支持参数修改 |
| 撤销/重做 | ❌ 未实现 | UndoRedoManager 已删除, 需重新设计 |

### Phase 6: 数据导出（中优先级） ✅ 已完成

| 功能 | 状态 | 备注 |
|------|------|------|
| CSV 导出 | ✅ 已实现 | exportToCSV (可见区间) + exportAllToCSV (全部) |
| 截图 | ✅ 已实现 | exportScreenshot (PNG/JPEG, 自定义背景色) |
| 绘图导入/导出 | ✅ 已实现 | 布局持久化含 overlay 数据 |

### Phase 7: 主题系统增强（中优先级）

| 功能 | 状态 | 备注 |
|------|------|------|
| 多内置主题 | ✅ 已实现 | dark, light, midnight, classic, highContrast (5 个) |
| 主题编辑器 | ❌ 未实现 | — |
| 自定义颜色方案 | ⚠️ 部分 | ColorInput 组件存在, 设置面板可改蜡烛颜色/坐标轴/网格 |
| 主题导入/导出 | ❌ 未实现 | — |

### Phase 8: 高级功能（低优先级）

| 功能 | 状态 | 备注 |
|------|------|------|
| 对比模式 | ✅ 已实现 | addComparison(symbol), 百分比归一化, 时间戳对齐 |
| 布局保存/加载 | ✅ 已实现 | localStorage 持久化 (save/load/delete/list) |
| 告警线可视化 | ✅ 已实现 | AlertManager + AlertLine overlay, crossing/above/below |
| 回放模式 | ✅ 已实现 | ReplayEngine, play/pause/step/跳转, 1-16x 速度 |
| 标尺工具 | ✅ 已实现 | priceRange, dateRange, dateAndPriceRange |
| Session Breaks | ❌ 未实现 | — |

### Phase 28: 观测组件（新增）

| 组件 | 状态 | 备注 |
|------|------|------|
| LiveSharpeChart | ✅ 已实现 | 实时夏普率面积图 |
| DrawdownAreaChart | ✅ 已实现 | 回撤可视化面积图 |

## 技术决策

1. **新图表类型**: 通过 klinecharts registerIndicator 实现数据转换 + 自定义渲染 ✅
2. **新指标**: 通过 registerIndicator 注册，计算逻辑在 calc 回调中实现 ✅
3. **新绘图工具**: 通过 registerOverlay 注册，渲染逻辑在 createPointFigures 中实现 ✅
4. **快捷键**: 全局 keydown 监听 + 可配置映射表 (KeyboardShortcutManager) ✅
5. **撤销/重做**: ❌ UndoRedoManager 已删除, 需基于 Command Pattern 重新设计
6. **主题**: 基于 klinecharts registerStyles + CSS 变量 ✅
7. **布局持久化**: localStorage + JSON 序列化 ✅
8. **i18n**: INI 格式 + Vite ?raw 懒加载（原 JSON 格式已迁移） ✅
9. **lodash 替换**: structuredClone 替代 cloneDeep, deepSet 工具函数替代 lodash/set ✅
10. **CSS**: 原生 CSS nesting + CSS 变量, 移除 Less 依赖 ✅

## 总体进度

| Phase | 完成度 | 状态 |
|-------|--------|------|
| 1. 图表类型 | 75% (6/8 原有 + 2 新增, 还需 4 种) | 🟡 进行中 |
| 2. 技术指标 | 85% (68/80+, 自定义 38 + 引擎 30) | 🟡 进行中 |
| 3. 绘图工具 | 90% (32 自定义 + 引擎内置, 已达标) | 🟢 基本完成 |
| 4. 快捷键 | 85% (16/18, 缺撤销/重做) | 🟡 进行中 |
| 5. UI/UX | 50% (搜索/设置已实现, 收藏/右键菜单/数据窗口未实现) | 🟡 进行中 |
| 6. 数据导出 | 100% | 🟢 完成 |
| 7. 主题系统 | 60% (5 主题 + 部分自定义, 无编辑器/导入导出) | 🟡 进行中 |
| 8. 高级功能 | 80% (5/6 已实现, 缺 Session Breaks) | 🟢 基本完成 |
| 28. 观测组件 | 100% | 🟢 完成 |

## 不在范围内

- Pine Script / 脚本语言
- 社区功能 / 分享
- 实时数据源（Datafeed 接口由消费者实现）
- 多图表布局管理（属于平台层，非图表库职责）
- 财务数据面板
- 新闻/事件日历
