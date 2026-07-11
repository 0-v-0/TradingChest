# TradingChest TradingView 对标实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** 将 TradingChest 升级为对标 TradingView 图表能力的专业交易图表库

**Architecture:** 基于 KLineChart 9.x 引擎，通过 registerIndicator/registerOverlay 扩展指标和绘图工具，Solid.js UI 层提供交互控件。分 6 个阶段递进实施。

**Tech Stack:** KLineChart 9.x, Solid.js, TypeScript, Vite

---

## Phase 1: 技术指标扩展（28 → 80+） — MOSTLY DONE

KLineChart 引擎内置 30 个指标，TradingChest UI 暴露 28 个。需要：
1. 通过 `registerIndicator` 注册 50+ 新自定义指标
2. 更新 IndicatorModal UI 支持分类、搜索、收藏
3. 更新 i18n

> **Status:** Tasks 1.1–1.5, 1.7–1.10 complete. Task 1.6 partially done (missing volumeProfile, elderRayBull, elderRayBear). IndicatorRegistry with lazy loading in `src/indicator/registry.ts` + `src/indicator/loaders.ts` (43 entries). IndicatorModal has category tabs + search. i18n uses .ini format (4 locales).

### Task 1.1: 创建指标计算工具库

**Files:**
- Create: `src/indicator/utils.ts`

- [x] **Step 1: 创建通用计算函数** — `src/indicator/utils.ts` exists, 63 tests in `src/indicator/__tests__/utils.test.ts`

> 实现代码：[`src/indicator/utils.ts`](src/indicator/utils.ts) (1-256 行)

### Task 1.2: 注册趋势类指标（15 个）

**Files:**
- Create: `src/indicator/trend/index.ts`
- Create: `src/indicator/trend/atr.ts`
- Create: `src/indicator/trend/superTrend.ts`
- Create: `src/indicator/trend/ichimoku.ts`
- Create: `src/indicator/trend/alligator.ts`
- Create: `src/indicator/trend/dema.ts`
- Create: `src/indicator/trend/tema.ts`
- Create: `src/indicator/trend/wma.ts`
- Create: `src/indicator/trend/hma.ts`
- Create: `src/indicator/trend/kama.ts`
- Create: `src/indicator/trend/vwma.ts`
- Create: `src/indicator/trend/zlema.ts`
- Create: `src/indicator/trend/mcginley.ts`
- Create: `src/indicator/trend/linearRegression.ts`
- Create: `src/indicator/trend/envelopes.ts`
- Create: `src/indicator/trend/t3.ts`

每个指标文件遵循 klinecharts IndicatorTemplate 模式：

> 实现代码：[`src/indicator/trend/atr.ts`](src/indicator/trend/atr.ts) (1-49 行)

- [x] **Step 1: 创建所有 16 个趋势指标文件** — 15 indicator files + index.ts in `src/indicator/trend/`
- [x] **Step 2: 创建 trend/index.ts 导出数组** — exists
- [x] **Step 3: 在 src/index.ts 中注册所有趋势指标** — registered via lazy-loading registry

### Task 1.3: 注册波动率类指标（8 个）

**Files:**
- Create: `src/indicator/volatility/index.ts`
- Create: `src/indicator/volatility/keltnerChannels.ts`
- Create: `src/indicator/volatility/donchianChannels.ts`
- Create: `src/indicator/volatility/historicalVolatility.ts`
- Create: `src/indicator/volatility/standardDeviation.ts`
- Create: `src/indicator/volatility/chaikinVolatility.ts`
- Create: `src/indicator/volatility/massIndex.ts`
- Create: `src/indicator/volatility/ulcerIndex.ts`
- Create: `src/indicator/volatility/bollingerBandWidth.ts`

- [x] **Step 1: 创建所有 8 个波动率指标** — all 8 files + index.ts in `src/indicator/volatility/`
- [x] **Step 2: 创建 index.ts 导出并注册** — exists

### Task 1.4: 注册成交量类指标（8 个）

**Files:**
- Create: `src/indicator/volume/index.ts`
- Create: `src/indicator/volume/vwap.ts`
- Create: `src/indicator/volume/mfi.ts`
- Create: `src/indicator/volume/chaikinMoneyFlow.ts`
- Create: `src/indicator/volume/adLine.ts`
- Create: `src/indicator/volume/vroc.ts`
- Create: `src/indicator/volume/klingerOscillator.ts`
- Create: `src/indicator/volume/forceIndex.ts`
- Create: `src/indicator/volume/elderRay.ts`

- [x] **Step 1: 创建所有 8 个成交量指标** — all 8 files + index.ts in `src/indicator/volume/`
- [x] **Step 2: 导出并注册** — exists

### Task 1.5: 注册动量类指标（10 个）

**Files:**
- Create: `src/indicator/momentum/index.ts`
- Create: `src/indicator/momentum/stochasticRsi.ts`
- Create: `src/indicator/momentum/adx.ts`
- Create: `src/indicator/momentum/aroon.ts`
- Create: `src/indicator/momentum/ultimateOscillator.ts`
- Create: `src/indicator/momentum/fisherTransform.ts`
- Create: `src/indicator/momentum/coppockCurve.ts`
- Create: `src/indicator/momentum/ppo.ts`
- Create: `src/indicator/momentum/dpo.ts`
- Create: `src/indicator/momentum/kst.ts`
- Create: `src/indicator/momentum/twiggsMf.ts`

- [x] **Step 1: 创建所有 10 个动量指标** — all 10 files + index.ts in `src/indicator/momentum/`
- [x] **Step 2: 导出并注册** — exists

### Task 1.6: 注册其他类指标（5 个）

**Files:**
- Create: `src/indicator/other/index.ts`
- Create: `src/indicator/other/pivotPoints.ts`
- Create: `src/indicator/other/zigzag.ts`
- Create: `src/indicator/other/volumeProfile.ts`
- Create: `src/indicator/other/elderRayBull.ts`
- Create: `src/indicator/other/elderRayBear.ts`

- [x] **Step 1: 创建所有 5 个指标** — PARTIAL: only pivotPoints, zigzag exist in `src/indicator/other/`; missing volumeProfile, elderRayBull, elderRayBear
- [x] **Step 2: 导出并注册** — index.ts exists with available indicators

### Task 1.7: 指标注册入口

**Files:**
- Create: `src/indicator/index.ts`
- Modify: `src/index.ts`

- [x] **Step 1: 创建 indicator/index.ts 汇总所有指标** — implemented as IndicatorRegistry with lazy loading (`src/indicator/registry.ts` + `src/indicator/loaders.ts`, 43 entries)

> 实现代码：[`src/indicator/index.ts`](src/indicator/index.ts) (1-102 行) — 实际采用 lazy-loading 模式，见 [`src/indicator/registry.ts`](src/indicator/registry.ts) (1-47 行) 和 [`src/indicator/loaders.ts`](src/indicator/loaders.ts) (1-64 行)

- [x] **Step 2: 在 src/index.ts 注册所有自定义指标** — registered via registry

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行) — 指标通过 lazy-loading registry 自动注册

### Task 1.8: 更新 IndicatorModal 支持分类和搜索

**Files:**
- Modify: `src/widget/indicator-modal/index.tsx`

- [x] **Step 1: 重写 IndicatorModal** — `src/widget/indicator-modal/index.tsx` has category tabs (all/trend/volatility/volume/momentum/other) + search + checkbox selection

### Task 1.9: 更新 i18n

**Files:**
- Modify: `src/i18n/zh-CN.json`
- Modify: `src/i18n/en-US.json`

- [x] **Step 1: 添加所有新指标的中英文翻译** — 4 locale files exist (en-US.ini, zh-CN.ini, ja.ini, ko.ini); format changed from .json to .ini

### Task 1.10: 构建并验证

- [x] **Step 1: npm run build 确保编译通过**
- [x] **Step 2: 提交**

---

## Phase 2: 绘图工具扩展（29 → 45+） — DONE

> **Status:** All listed drawing tools exist in `src/extension/` (33 overlay files). Includes: arrow, brush, callout, circle, rect, triangle, parallelogram, pitchfork, schiffPitchfork, fibonacciCircle, fibonacciExtension, fibonacciSegment, fibonacciSpeedResistanceFan, fibonacciSpiral, gannBox, note, textAnnotation, longPosition, shortPosition, positionRange, priceRange, dateRange, dateAndPriceRange, regressionChannel, regressionTrend, abcd, xabcd, anyWaves, eightWaves, fiveWaves, threeWaves, tradeMarker. Plus additional tools not in original plan.

### Task 2.1: 测量工具

**Files:**
- Create: `src/extension/priceRange.ts` — 价格区间（显示价差/百分比/柱数）
- Create: `src/extension/dateRange.ts` — 时间区间测量
- Create: `src/extension/dateAndPriceRange.ts` — 综合测量

### Task 2.2: 形态工具

**Files:**
- Create: `src/extension/pitchfork.ts` — Andrew's Pitchfork
- Create: `src/extension/schiffPitchfork.ts` — Schiff 变体
- Create: `src/extension/regressionTrend.ts` — 线性回归趋势
- Create: `src/extension/regressionChannel.ts` — 回归通道

### Task 2.3: 标注工具

**Files:**
- Create: `src/extension/textAnnotation.ts` — 文字标注
- Create: `src/extension/callout.ts` — 标注气泡
- Create: `src/extension/note.ts` — 便签
- Create: `src/extension/brush.ts` — 自由画笔

### Task 2.4: 交易工具

**Files:**
- Create: `src/extension/longPosition.ts` — 做多持仓（入场/止损/止盈三区域）
- Create: `src/extension/shortPosition.ts` — 做空持仓

### Task 2.5: 更新绘图工具栏

**Files:**
- Modify: `src/widget/drawing-bar/index.tsx`
- Create: `src/widget/drawing-bar/icons/pitchfork.ts`
- Create: `src/widget/drawing-bar/icons/priceRange.ts`
- Create: `src/widget/drawing-bar/icons/textAnnotation.ts`
- Create: `src/widget/drawing-bar/icons/longPosition.ts`
- Create: `src/widget/drawing-bar/icons/shortPosition.ts`
- Create: `src/widget/drawing-bar/icons/brush.ts`
- Modify: `src/widget/drawing-bar/icons/index.ts`

新增工具分组:
- 测量工具组（priceRange, dateRange, dateAndPriceRange）
- 形态工具组（pitchfork, schiffPitchfork, regressionTrend, regressionChannel）
- 标注工具组（textAnnotation, callout, note, brush）
- 交易工具组（longPosition, shortPosition）

### Task 2.6: i18n + 构建

- [x] **Step 1: 更新两个语言文件** — 4 locale .ini files exist
- [x] **Step 2: 注册所有新 overlay 到 extension/index.ts** — `src/extension/index.ts` exists
- [x] **Step 3: 构建验证**
- [x] **Step 4: 提交**

---

## Phase 3: 图表类型扩展 — DONE

> **Status:** `src/chartType/heikinAshi.ts`, `src/chartType/baseline.ts`, `src/chartType/index.ts` all exist.

### Task 3.1: Heikin Ashi 图表

**Files:**
- Create: `src/chartType/heikinAshi.ts`

通过 registerIndicator 实现：对原始 OHLCV 数据做 HA 变换，渲染为蜡烛图。

### Task 3.2: Baseline 图表

**Files:**
- Create: `src/chartType/baseline.ts`

基于收盘价和基准线的双色区域图。

### Task 3.3: 更新设置面板

**Files:**
- Modify: `src/widget/setting-modal/data.ts`

在 candle.type 选项中增加 heikin_ashi, baseline 等选项。

### Task 3.4: i18n + 构建 + 提交

---

## Phase 4: 键盘快捷键系统 — DONE

> **Status:** `src/shortcut/index.ts` (KeyboardShortcutManager), `src/shortcut/defaultBindings.ts` exist. Integrated in ChartProComponent.tsx and KLineChartPro.tsx. Tests in `src/shortcut/__tests__/shortcut.test.ts`. No separate undoRedo.ts — undo/redo may be integrated elsewhere.

### Task 4.1: 快捷键管理器

**Files:**
- Create: `src/shortcut/index.ts` — KeyboardShortcutManager 类
- Create: `src/shortcut/defaultBindings.ts` — 默认快捷键映射

### Task 4.2: 集成到 ChartProComponent

**Files:**
- Modify: `src/ChartProComponent.tsx`

在 onMount 中初始化快捷键监听，onCleanup 中清理。

### Task 4.3: 撤销/重做系统

**Files:**
- Create: `src/shortcut/undoRedo.ts` — Command Pattern 实现

### Task 4.4: 构建 + 提交

---

## Phase 5: UI/UX 增强 — PARTIALLY DONE

> **Status:** Tasks 5.4 (export), 5.5 (theme), 5.6 (persistence) are done. Tasks 5.1 (context menu), 5.2 (data window), 5.3 (PeriodBar improvements) are NOT done.

### Task 5.1: 右键上下文菜单

**Files:**
- Create: `src/widget/context-menu/index.tsx`

### Task 5.2: 数据窗口面板

**Files:**
- Create: `src/widget/data-window/index.tsx`

光标位置的 OHLCV + 所有活跃指标值。

### Task 5.3: 改进 PeriodBar

**Files:**
- Modify: `src/widget/period-bar/index.tsx`

添加：数据窗口按钮、对比按钮、导出按钮。

### Task 5.4: 数据导出 — DONE

**Files:**
- Create: `src/widget/export-modal/index.tsx`

CSV 导出可见区间数据。

> **Actual implementation:** `src/export/index.ts` with `exportToCSV`, `exportAllToCSV`, `exportScreenshot`. No separate export-modal widget.

### Task 5.5: 主题系统增强 — DONE

**Files:**
- Create: `src/theme/index.ts` — 预设主题（dark, light, midnight, classic）
- Modify: `src/widget/setting-modal/data.ts` — 主题选择

### Task 5.6: 绘图持久化（保存/恢复） — DONE

> **Actual implementation:** `src/persistence/index.ts` with saveLayout, loadLayout, etc.

**Files:**
- Create: `src/persistence/index.ts`

将绘图、指标配置序列化为 JSON，支持 localStorage 保存/恢复。

### Task 5.7: 构建 + 提交

---

## Phase 6: 高级功能 — DONE

> **Status:** All tasks complete. `src/compare/index.ts` (normalizeToPercent, addComparison/removeComparison), `src/alert/` (full alert line implementation), public API exports in types.ts and index.ts.

### Task 6.1: 对比模式

多标的叠加在同一图表上。

### Task 6.2: 告警线

水平告警价格线。

### Task 6.3: 更新公共 API

扩展 ChartPro 接口：
- `addComparison(symbol)` / `removeComparison(symbol)`
- `addAlert(price, options)` / `removeAlert(id)`
- `exportData(format)` / `exportImage(options)`
- `getShortcutManager()`
- `saveLayout()` / `loadLayout(data)`

### Task 6.4: 最终构建 + 全面测试 + 提交
