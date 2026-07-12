# TradingChest 质量与能力升级计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 修复 TradingChest 的工程质量问题（零测试、全局变量、内存泄漏），补齐与 TradingView 的核心功能差距（数据层健壮性、多图表布局、报警系统）

**Architecture:** 分 6 个阶段递进 — 先夯实基础（测试 + bug fix），再加固数据层（WebSocket 重连），然后补齐核心功能（报警 + 多品种对比 + 多图表布局）。每个阶段独立可交付。

**Tech Stack:** KLineChart 9.x, Solid.js 1.6, TypeScript, Vitest, Vite

---

## 文件结构总览

新建文件:
  src/indicator/__tests__/            # 指标单元测试
    superTrend.test.ts
  src/persistence/__tests__/
    persistence.test.ts
  src/shortcut/__tests__/
    shortcut.test.ts
  src/export/__tests__/
    export.test.ts
  src/core/__tests__/
    adjustFromTo.test.ts
    buildStyles.test.ts
  # Vitest 配置在 vite.config.ts 中
  src/core/                           # 从 ChartProComponent 抽取的纯函数
    adjustFromTo.ts
    buildStyles.ts
    # indicatorClickDetector.ts — 已删除，改为 tradeVisualization.ts 中的模块级 _hitTargetsMap
  src/datafeed/                       # 数据层增强
    ReconnectingWebSocket.ts          # 自动重连 WebSocket
  src/alert/                          # 报警系统
    index.ts
    AlertLine.ts                      # overlay 实现
    types.ts
  src/compare/                        # 多品种对比
    index.ts

修改文件:
  package.json                        # 添加 test 脚本
  src/KLineChartPro.tsx               # globalThis 替换为模块级 _hitTargetsMap
  src/ChartProComponent.tsx           # 抽取纯函数、集成新功能
  src/DefaultDatafeed.ts              # 实现 unsubscribe、重连
  src/types.ts                        # 扩展接口
  src/index.ts                        # 导出新模块


---

## Phase 1: 测试基础设施 + 核心指标测试（P0）

### Task 1.1: 配置 Vitest

- [x] **Step 1: 创建 vitest.config.ts**（实际：Vitest 配置在 vite.config.ts 中，无独立 vitest.config.ts）

> 实现代码：[`vite.config.ts`](vite.config.ts) (test 配置)

- [x] **Step 2: 确认 devDependencies 已包含 vitest 和 vite-plugin-solid**

`package.json` 中已存在 `"vitest": "^0.28.4"` 和 `"vite-plugin-solid": "^2.6.1"`，无需额外安装。在 `scripts` 中添加:

"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"

- [x] **Step 3: 运行 `npm test` 确认配置正确（应该 0 测试通过）**

Run: `npm test`
Expected: "No test files found" 或 0 tests

- [x] **Step 4: Commit**

**验证:** `npm test`

---

### Task 1.2: 抽取纯函数 — adjustFromTo

从 `ChartProComponent.tsx:134-184` 抽取 `adjustFromTo` 为独立模块，方便测试。

- [x] **Step 1: 编写 adjustFromTo 的测试**

> 实现代码：[`src/core/__tests__/adjustFromTo.test.ts`](src/core/__tests__/adjustFromTo.test.ts) (1-81 行)

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/__tests__/adjustFromTo.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: 创建 src/core/adjustFromTo.ts — 从 ChartProComponent.tsx:134-184 提取**

> 实现代码：[`src/core/adjustFromTo.ts`](src/core/adjustFromTo.ts) (1-78 行)

- [x] **Step 4: 在 ChartProComponent.tsx 中替换为 import**

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

- [x] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/core/__tests__/adjustFromTo.test.ts`
Expected: PASS

- [x] **Step 6: Commit**

**验证:** `npx vitest run src/core/__tests__/adjustFromTo.test.ts`

---

### Task 1.3: 抽取纯函数 — buildStyles

从 `ChartProComponent.tsx:478-500` 抽取 `buildStyles`。

- [x] **Step 1: 编写 buildStyles 测试**

> 实现代码：[`src/core/__tests__/buildStyles.test.ts`](src/core/__tests__/buildStyles.test.ts) (1-38 行)

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/__tests__/buildStyles.test.ts`
Expected: FAIL

- [x] **Step 3: 创建 src/core/buildStyles.ts**

> 实现代码：[`src/core/buildStyles.ts`](src/core/buildStyles.ts) (1-46 行)

- [x] **Step 4: ChartProComponent.tsx 中替换为 import**

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

- [x] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/core/__tests__/buildStyles.test.ts`
Expected: PASS

- [x] **Step 6: 运行构建确保不破坏**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 7: Commit**

**验证:** `npx vitest run src/core/__tests__/buildStyles.test.ts && npm run build-core`

---

### Task 1.4: SuperTrend 指标单元测试

- [x] **Step 1: 编写测试**

> 实现代码：[`src/indicator/__tests__/superTrend.test.ts`](src/indicator/__tests__/superTrend.test.ts) (1-52 行)

- [x] **Step 2: 运行测试**

Run: `npx vitest run src/indicator/__tests__/superTrend.test.ts`
Expected: PASS

- [x] **Step 3: Commit**

**验证:** `npx vitest run src/indicator/__tests__/superTrend.test.ts`

---

### Task 1.5: Persistence 模块单元测试

- [x] **Step 1: 编写测试**

> 实现代码：[`src/persistence/__tests__/persistence.test.ts`](src/persistence/__tests__/persistence.test.ts) (1-267 行)

- [x] **Step 2: 运行测试**

Run: `npx vitest run src/persistence/__tests__/persistence.test.ts`
Expected: PASS

- [x] **Step 3: Commit**

**验证:** `npx vitest run src/persistence/__tests__/persistence.test.ts`

---

### Task 1.6: KeyboardShortcutManager 单元测试

- [x] **Step 1: 编写测试**

> 实现代码：[`src/shortcut/__tests__/shortcut.test.ts`](src/shortcut/__tests__/shortcut.test.ts) (1-478 行)

- [x] **Step 2: 运行测试**

Run: `npx vitest run src/shortcut/__tests__/shortcut.test.ts`
Expected: PASS

- [x] **Step 3: Commit**

**验证:** `npx vitest run src/shortcut/__tests__/shortcut.test.ts`

---

## Phase 2: 消除架构硬伤（P0）

### Task 2.1: 消除 globalThis.__tradeVisHitTargets

> **NOTE:** IndicatorClickDetector was implemented then removed — it was never actually wired in. The codebase instead uses module-level `_hitTargetsMap` in `tradeVisualization.ts` with per-instance keys and `getTradeVisHitTargets()`. The original globalThis problem is solved via instance-scoped maps.

用实例级 `IndicatorClickDetector` 替代全局变量。

- [x] **Step 1: 编写测试**

> ~~实现代码：[`src/core/__tests__/indicatorClickDetector.test.ts`](src/core/__tests__/indicatorClickDetector.test.ts) （已删除）~~

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/core/__tests__/indicatorClickDetector.test.ts`
Expected: FAIL

- [x] **Step 3: 实现 IndicatorClickDetector**

> ~~实现代码：[`src/core/indicatorClickDetector.ts`](src/core/indicatorClickDetector.ts) （已删除）~~

- [x] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/core/__tests__/indicatorClickDetector.test.ts`
Expected: PASS

- [x] **Step 5: 在 KLineChartPro.tsx 中替换全局变量逻辑**

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

- [x] **Step 6: 运行构建确认**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 7: Commit**

**验证:** `npm run build-core`

---

### Task 2.2: 修复 DefaultDatafeed.unsubscribe 内存泄漏

- [x] **Step 1: 实现 unsubscribe**

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

- [x] **Step 2: 添加 dispose 方法关闭 WebSocket**

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

- [x] **Step 3: 运行构建确认**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 4: Commit**

**验证:** `npm run build-core`

---

## Phase 3: 数据层加固（P1）

### Task 3.1: ReconnectingWebSocket

自动重连 WebSocket，带指数退避。

- [x] **Step 1: 编写测试**

> 实现代码：[`src/datafeed/__tests__/ReconnectingWebSocket.test.ts`](src/datafeed/__tests__/ReconnectingWebSocket.test.ts) (1-25 行)

- [x] **Step 2: 实现 ReconnectingWebSocket**

> 实现代码：[`src/datafeed/ReconnectingWebSocket.ts`](src/datafeed/ReconnectingWebSocket.ts) (1-67 行)

- [x] **Step 3: 运行测试**

Run: `npx vitest run src/datafeed/__tests__/ReconnectingWebSocket.test.ts`
Expected: PASS

- [x] **Step 4: Commit**

**验证:** `npx vitest run src/datafeed/__tests__/ReconnectingWebSocket.test.ts`

---

### Task 3.2: K 线数据缓存 — 已取消

> **NOTE (2026-07-11):** `DataCache` 曾实现但从未集成到 `DefaultDatafeed`，对运行时零贡献。已作为 dead code 删除（`src/datafeed/DataCache.ts`、`src/datafeed/__tests__/DataCache.test.ts`）。klinecharts 内部已维护 `dataList`，且 `getHistoryKLineData` 为区间查询，现有缓存设计不匹配；若未来需要 datafeed 层缓存，应按 `from/to` 区间重新设计。

- [x] ~~Step 1–4: 实现 DataCache~~（已回滚删除）

---

### Task 3.3: 集成 ReconnectingWebSocket 到 DefaultDatafeed

- [x] **Step 1: 替换原生 WebSocket 为 ReconnectingWebSocket**

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

- [x] **Step 2: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 3: Commit**

**验证:** `npm run build-core`

---

## Phase 4: 报警系统（P2）

### Task 4.1: Alert 类型定义

- [x] **Step 1: 创建类型**

> 实现代码：[`src/alert/types.ts`](src/alert/types.ts) (1-14 行)

- [x] **Step 2: Commit**

### Task 4.2: AlertManager 实现

- [x] **Step 1: 编写测试**

> 实现代码：[`src/alert/__tests__/alert.test.ts`](src/alert/__tests__/alert.test.ts) (1-120 行)

- [x] **Step 2: 实现 AlertManager**

> 实现代码：[`src/alert/index.ts`](src/alert/index.ts) (1-70 行)

- [x] **Step 3: 运行测试**

Run: `npx vitest run src/alert/__tests__/alert.test.ts`
Expected: PASS

- [x] **Step 4: Commit**

**验证:** `npx vitest run src/alert/__tests__/alert.test.ts`

---

### Task 4.3: Alert Overlay（水平报警线）

- [x] **Step 1: 创建 AlertLine overlay**

> 实现代码：[`src/alert/AlertLine.ts`](src/alert/AlertLine.ts) (1-31 行)

- [x] **Step 2: 在 extension/index.ts 注册**

> 实现代码：[`src/extension/index.ts`](src/extension/index.ts)

- [x] **Step 3: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 4: Commit**

**验证:** `npm run build-core`

---

### Task 4.4: 集成 AlertManager 到 ChartPro API

- [x] **Step 1: 扩展 ChartPro 接口**

> 实现代码：[`src/types.ts`](src/types.ts) (1-150 行)

- [x] **Step 2: 在 KLineChartPro 中实现**

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

- [x] **Step 3: 在 index.ts 导出**

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

- [x] **Step 4: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 5: Commit**

**验证:** `npm run build-core`

---

## Phase 5: 多品种对比（P2）

### Task 5.1: Compare 数据归一化

- [x] **Step 1: 编写测试**

> 实现代码：[`src/compare/__tests__/compare.test.ts`](src/compare/__tests__/compare.test.ts) (1-34 行)

- [x] **Step 2: 实现**

> 实现代码：[`src/compare/index.ts`](src/compare/index.ts) (1-25 行)

- [x] **Step 3: 运行测试**

Run: `npx vitest run src/compare/__tests__/compare.test.ts`
Expected: PASS

- [x] **Step 4: Commit**

**验证:** `npx vitest run src/compare/__tests__/compare.test.ts`

---

### Task 5.2: Compare API 集成

- [x] **Step 1: 扩展 ChartPro 接口**

> 实现代码：[`src/types.ts`](src/types.ts) (1-150 行)

- [x] **Step 2: 在 KLineChartPro 中实现（获取对比品种数据 + 归一化）**

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

- [x] **Step 3: 导出新类型**

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

- [x] **Step 4: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 5: Commit**

**验证:** `npm run build-core`

---

## Phase 6: 错误处理与代码清理（P1）

### Task 6.1: DefaultDatafeed 添加错误处理

- [x] **Step 1: 为 searchSymbols 添加 try/catch 和 response.ok 检查**

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

- [x] **Step 2: 为 getHistoryKLineData 添加同样的错误处理**

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

- [x] **Step 3: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 4: Commit**

**验证:** `npm run build-core`

---

### Task 6.2: 消除 @ts-expect-error

- [x] **Step 1: 修复 ChartProComponent.tsx 中的 5 处 @ts-expect-error**

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

- [x] **Step 2: 运行构建确认无 TS 错误**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 3: Commit**

**验证:** `npm run build-core`

---

### Task 6.3: 运行全部测试 + 构建验证

- [x] **Step 1: 运行完整测试套件**

Run: `npm test`
Expected: All tests PASS

- [x] **Step 2: 运行完整构建**

Run: `npm run build`
Expected: 构建成功，dist/ 产物正常

- [x] **Step 3: Final commit**

**验证:** `npm test && npm run build`

---

## 后续阶段（规划，不在本计划实施范围）

以下功能建议在本计划完成后、独立的计划中实施:

### Phase 7: 多图表布局（P1 — 需要大量 UI 工作）
- 多窗格容器组件 (`src/layout/MultiChartLayout.tsx`)
- 窗格同步（十字线联动、时间轴同步）
- 拖拽调整窗格大小

### Phase 8: K 线回放 / Bar Replay（P2）
- 回放控制器（播放/暂停/速度/跳转）
- 数据切片和步进

### Phase 9: 脚本引擎 / Pine Script 替代（P3）
- DSL 设计和解析器
- 指标 DSL → IndicatorTemplate 编译
- 在线编辑器 UI

### Phase 10: 指标懒加载和增量计算（P1 性能）
- 按需 `registerIndicator` 替代全量注册
- `calc` 函数增量模式（传入 prevResult + 新增数据）
