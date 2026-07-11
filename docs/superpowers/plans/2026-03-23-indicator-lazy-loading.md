# 指标懒加载 + 增量计算 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将 43 个自定义指标从全量启动注册改为按需懒加载，并为实时更新添加增量计算缓存，减少初始化开销和运行时 CPU 占用

**Architecture:** 创建 `IndicatorRegistry` 中间层管理指标注册状态，用动态 `import()` 按需加载指标模块。为 `calc` 函数添加 `IncrementalCalcWrapper` 缓存上一次结果，当仅追加新 K 线时只重算最后 N 个值。

**Tech Stack:** KLineChart 9.x (`registerIndicator`), TypeScript dynamic imports, Vitest

---

## 文件结构

```
新建文件:
  src/indicator/registry.ts                    # IndicatorRegistry — 懒加载注册管理
  src/indicator/loaders.ts                     # 每个指标的动态 import 映射
  src/indicator/__tests__/registry.test.ts     # Registry 单元测试
  src/indicator/incrementalCalc.ts             # 增量计算包装器
  src/indicator/__tests__/incrementalCalc.test.ts

修改文件:
  src/index.ts                                 # 移除全量 registerIndicator 循环
  src/indicator/index.ts                       # 保留 indicatorCategories，移除 customIndicators 默认导出
  src/ChartProComponent.tsx                    # createIndicator 改为 async，先 ensureRegistered
  src/widget/indicator-modal/index.tsx         # 修复 @ts-expect-error
```

---

## Task 1: IndicatorRegistry — 懒加载核心

**Files:**
- Create: `src/indicator/__tests__/registry.test.ts`
- Create: `src/indicator/registry.ts`

- [x] **Step 1: 编写测试**

> 实现代码：[`src/indicator/__tests__/registry.test.ts`](src/indicator/__tests__/registry.test.ts) (1-62 行)

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/indicator/__tests__/registry.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: 实现 IndicatorRegistry**

> 实现代码：[`src/indicator/registry.ts`](src/indicator/registry.ts) (1-47 行)

- [x] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/indicator/__tests__/registry.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

git add src/indicator/registry.ts src/indicator/__tests__/registry.test.ts
git commit -m "feat: add IndicatorRegistry for lazy-loading indicator management"

---

## Task 2: 指标动态加载映射

**Files:**
- Create: `src/indicator/loaders.ts`

- [x] **Step 1: 创建 loaders 文件**

每个自定义指标对应一个动态 `import()` 函数。klinecharts 内置指标（MA, EMA, SMA, BOLL, SAR, BBI, VOL, MACD, KDJ, RSI, BIAS, BRAR, CCI, DMI, CR, PSY, DMA, TRIX, OBV, VR, WR, MTM, EMV, ROC, PVT, AO）不需要 loader。

> 实现代码：[`src/indicator/loaders.ts`](src/indicator/loaders.ts) (1-64 行)

- [x] **Step 2: 运行构建确认 import 路径正确**

Run: `npm run build-core`
Expected: 构建成功（Vite 会为每个动态 import 创建 chunk）

- [x] **Step 3: Commit**

git add src/indicator/loaders.ts
git commit -m "feat: add dynamic import loaders for all 43 custom indicators"

---

## Task 3: 增量计算包装器

**Files:**
- Create: `src/indicator/__tests__/incrementalCalc.test.ts`
- Create: `src/indicator/incrementalCalc.ts`

- [x] **Step 1: 编写测试**

> 实现代码：[`src/indicator/__tests__/incrementalCalc.test.ts`](src/indicator/__tests__/incrementalCalc.test.ts) (1-99 行)

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/indicator/__tests__/incrementalCalc.test.ts`
Expected: FAIL

- [x] **Step 3: 实现增量计算包装器**

> 实现代码：[`src/indicator/incrementalCalc.ts`](src/indicator/incrementalCalc.ts) (1-73 行)

- [x] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/indicator/__tests__/incrementalCalc.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

git add src/indicator/incrementalCalc.ts src/indicator/__tests__/incrementalCalc.test.ts
git commit -m "feat: add incremental calculation wrapper for indicator performance"

---

## Task 4: 重构 index.ts — 移除全量注册

**Files:**
- Modify: `src/index.ts:32-35`
- Modify: `src/indicator/index.ts`

- [x] **Step 1: 修改 `src/indicator/index.ts`**

移除 `customIndicators` 默认导出，改为导出 registry 和 loaders：

> 实现代码：[`src/indicator/index.ts`](src/indicator/index.ts) (1-102 行)

- [x] **Step 2: 修改 `src/index.ts`**

移除全量指标注册，保留 overlay 和 chartType 注册（它们数量少且启动必需）：

替换 lines 17-18 和 32-35:

删除:

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

保留:

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

添加导出:

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

- [x] **Step 3: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 4: Commit**

git add src/index.ts src/indicator/index.ts
git commit -m "refactor: remove eager indicator registration, export lazy registry"

---

## Task 5: ChartProComponent — async createIndicator

**Files:**
- Modify: `src/ChartProComponent.tsx`

- [x] **Step 1: 修改 createIndicator 函数为 async**

在 `ChartProComponent.tsx` 中:

1. 添加 import:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

2. 将 `createIndicator` 改为 async（当前在 line ~47）:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

3. 更新所有调用 `createIndicator` 的地方加上 `await`：

在 `onMount` 中（初始化主图指标）:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

在 `onMainIndicatorChange` 回调中:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

在 `onSubIndicatorChange` 回调中同理。

- [x] **Step 2: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 3: 运行全部测试**

Run: `npx vitest run`
Expected: 全部 PASS

- [x] **Step 4: Commit**

git add src/ChartProComponent.tsx
git commit -m "refactor: make createIndicator async for lazy-loading support"

---

## Task 6: 修复 indicator-modal @ts-expect-error

**Files:**
- Modify: `src/widget/indicator-modal/index.tsx:169-170`

- [x] **Step 1: 修复类型**

在 `src/widget/indicator-modal/index.tsx` 中:

将 `IndicatorModalProps` 的 `subIndicators` 类型从 `object` 改为 `Record<string, string>`:

> 实现代码：[`src/widget/indicator-modal/index.tsx`](src/widget/indicator-modal/index.tsx) (1-228 行)

然后删除 line 169 的 `// @ts-expect-error` 注释。

- [x] **Step 2: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 3: Commit**

git add src/widget/indicator-modal/index.tsx
git commit -m "fix: type IndicatorModalProps.subIndicators as Record<string, string>"

---

## Task 7: 全量验证

- [x] **Step 1: 运行完整测试**

Run: `npx vitest run`
Expected: All PASS

- [x] **Step 2: 运行完整构建**

Run: `npm run build`
Expected: 构建成功

- [x] **Step 3: 验证 bundle 中指标代码被分割**

Run: `ls -la dist/`
Expected: 主 bundle 大小应比之前（344KB ES）减少，或出现额外 chunk 文件

- [x] **Step 4: Commit**

git add -A
git commit -m "chore: verify lazy-loading indicator build and test suite"
