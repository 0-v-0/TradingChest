# src 代码优化实施计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [x]` / `- [ ]`）语法来跟踪进度。

**目标：** 按重要性分阶段修复 src 中的代码质量/性能问题。先高优先级（ChartProComponent 双 effect + Set 化 + widgetRef 守卫 + setStyles 合并），再中优先级（重复处理器、模板提取、类型断言、API 一致性）。低优先级暂不执行。

**架构：** 4 个任务分组。每组任务独立提交，运行 `npm run lint` 与 `npm test` 双线验证。改动以"小而可验证"为原则，不触碰未涉及的模块。

**技术栈：** TypeScript、Solid.js 1.x、KLineChart 10.x、Vitest、ESLint

**基线确认：** `npm run lint` 通过，`npm test` 28 文件 / 315 测试通过。
**验证命令：** `npm run lint && npm test`

---

## 目标项目清单

### 阶段 1 — 高优先级（5 项）

| # | 位置 | 问题 | 行动 | 状态 |
|---|---|---|---|---|
| H1 | `src/ChartProComponent.tsx` 行 826-862 | 双 effect 都调 `widget.setSymbol`，初始化无意义触发 | 合并为单 effect（保留 prev + reset 语义） | - [x] `128349e` |
| H2 | `src/ChartProComponent.tsx` 行 267-308 | `fillOverlays` 14 项数组在 `markSelectedOverlay` 中每次重建 | 提升为模块作用域常量 `FILL_OVERLAY_NAMES: Set<string>` | - [x] `128349e` |
| H3 | `src/ChartProComponent.tsx` 行 600-823 | `widgetRef!` 非空断言 4 处 | 在 `onMount`/`onCleanup` 开头增加 `if (!widgetRef) return` 守卫 | - [x] `128349e` |
| H4 | `src/ChartProComponent.tsx` 行 864-871 | Theme 切换连续两次 `setStyles` | 保留双调（klinecharts API 不支持合并），改用 `createMemo` 缓存 `tooltipFeatures(t)` 防止每次重绘重算 | - [x] `128349e` |

### 阶段 2 — 中优先级（12 项，已与用户确认范围与做法）

| # | 位置 | 问题 | 行动 | 状态 |
|---|---|---|---|---|
| M1 | `src/ChartProComponent.tsx` 行 1149-1195 | OverlayPropertyBar 4 个 `onColorChange/FillColor/LineWidth/LineStyle` 处理器结构重复 | 抽取私有 helper `applyOverlayStyleChange<K extends keyof SelectedOverlay>(propKey: K, value: SelectedOverlay[K])` | - [x] `128349e` |
| M2 | `src/widget/drawing-bar/index.tsx` 行 50-100 | 9 个图标独立 signal | 合并为 `const [iconMap, setIconMap] = createSignal<Record<GroupKey, string>>(INIT_ICON_MAP)`，9 个 setter 包装为 `(v) => setIconMap({ ...iconMap(), key: v })` | - [x] `78bef23` |
| M3 | `src/ChartProComponent.tsx` 行 122-156 | `createIndicator` 中 8 个 `if (defaultFeatures[i])` 重复 | 构建 `FEATURE_INDICES: Record<'visible'\|'hidden', readonly number[]>` 查表 | - [x] `128349e` |
| M4 | `src/indicator/**/(trend\|momentum\|volatility\|volume\|other)/*.ts` 71 处 | `params[i] as number` 类型断言 | 合并为一个 commit（跨 17 个文件 71 处）。在 `src/indicator/utils.ts` 加导出 `function num(p: number \| string \| undefined, fallback: number): number`，逐文件替换；新增对应单元测试 | - [x] `17eff2d` |
| M5 | `src/indicator/registry.ts` 行 73-86 | `wrapCalcParamsValidation` 用 for 循环分配 10k+ 独立对象 | 改用 `result.fill({...nanTemplate})` | - [x] `fda6c5e` |
| M6 | `src/extension/fibonacciSpeedResistanceFan.ts` 行 49-50 | `lines2.concat(getRayLine(...))` 每帧重绘分配 | 改 `lines2.push(...result)`，`getRayLine` 返回数组为常规数组；对 `[]` 空数组合并 cases 也兼容 | - [x] `5bdacbc` |
| M7 | `src/compare/index.ts` 行 27 | `basePrice===0` 时 `data.map(()=>0)` 整组分配 | 改 `new Array(data.length).fill(0)`；既有测试 `compare.test.ts` 已覆盖语义不变 | - [x] `40ef8d2` |
| M8 | `src/extension/fibonacci{Circle,Segment,Extension,SpeedResistanceFan}.ts` 行 1-81 | 4 文件 80% 结构相同 | 抽 `createFibHorizontalLines(percents, mapper)` 与 `createFibConcentricCircles(percents, mapper)` 在 `src/extension/utils.ts`，4 文件改用 helper | - [x] `c2f2841` |
| M9 | `src/KLineChartPro.tsx` 行 449-511 | `addComparison` 中 calc 内每根 K 线做二分搜索（O(n²)） | 改 capture 阶段一次性构建 `mainLookup` Map（使用 mainData 与 compData 时间戳的对齐），calc 中直接按 timestamp 取 | - [x] `46378dc` |
| M10 | `src/KLineChartPro.tsx` 行 539-577 与 `ChartProComponent.tsx` 行 813-824 | dispose() 与 onCleanup 双轨释放 | 加 `disposed` 闭包守卫 + 在 `onCleanup` 用闭包变量捕获最初 symbol/period（而非读 signal 末值） | - [x] `1438e06` |
| M11 | `src/extension/positionUtils.ts` 行 137 | `side === 'long' ? 'bottom' as const : 'top' as const` | 移除冗余 `as const`，TS 从条件表达式推断字面量联合类型 | - [x] `7b6112e` |
| M12 | `src/alert/AlertLine.ts` 行 26 | 硬编码 `[6, 4]` 重复了 `core/buildStyles.ts` 的 `DASH_DASHED` | 在 `core/buildStyles.ts` export `DASH_DASHED`，`AlertLine.ts` import 并使用 | - [x] `66b660f` |

### 阶段 3 — 验证

| # | 行动 | 状态 |
|---|---|---|
| V1 | `npm run lint` 0 错 0 警告 | - [x] |
| V2 | `npm test` 全部 315 测试通过 | - [x] |
| V3 | diff 自审：无意外改动；每个 H/M 任务对应一处 commit | - [x] |

---

## 实施约束

1. **不重构未相关代码**：禁止触碰业务逻辑，禁止重命名公开 API。
2. **必须**为以下改动编写或维护单元测试：
   - M4: 在 `src/indicator/__tests__/utils.test.ts` 加 `num()` 函数测试
   - M7: 已存在 `compare.test.ts`，扩展覆盖 `fill(0)` 语义不变
   - M9: 在 `src/__tests__/integration/` 加一个 compare 多 K 性能正确的测试
3. **类型断言清理（M4）**优先替换"被赋值给 const 局部变量"的 51 处；剩下 20 处可在同函数内嵌入处（如 `Math.min(params[0] as number, MAX_LEVELS)`）保留代替，统计可以放宽。
4. **H4 处理细节：** 保留双 `setStyles` 调用（klinecharts API 限制），但用 `createMemo` 缓存 `tooltipFeatures(t)`，避免 unmount/重订阅时重复重算。注释解释为什么需要双调。
5. **M2 实现细节：** setIconMap 包装函数：
   ```ts
   const setIcon = (key: GroupKey) => (v: string) => setIconMap({ ...iconMap(), [key]: v })
   const setSingleLineIcon = setIcon('singleLine')
   // ...etc
   ```
   这保留了原 setter 签名、调用点不变。
6. **M4 跨 17 文件合并为一个 commit**：使用 `git add src/indicator/` 全体提交，commit message 包含"71 处参数断言清除"+ `num()` 守卫添加。
7. **每个 commit 包含**：`lint + test` 通过 + commit message 形如 `perf: <范围> <一句话>` 或 `refactor: ...` 或 `fix: ...`。

---

## 提交记录

| Commit | 任务 | 说明 |
|--------|------|------|
| `128349e` | H1, H2, H3, H4, M1, M3 | dedupe setSymbol/createEffect, hoist fillOverlays to Set, guard widgetRef, createMemo tooltipFeatures, applyOverlayStyleChange helper, TOOLTIP_FEATURE_INDICES lookup |
| `78bef23` | M2 | merge 9 icon signals into single iconMap signal |
| `17eff2d` | M4 | remove type assertions on params (71 处跨 17 文件) |
| `fda6c5e` | M5 | use Array.fill instead of for-loop in wrapCalcParamsValidation |
| `5bdacbc` | M6 + M4 lint fix | replace concat with push in fibonacciSpeedResistanceFan; fix `{}`→`object` and `any` lint errors from M4 |
| `40ef8d2` | M7 | use Array.fill(0) instead of data.map(()=>0) |
| `c2f2841` | M8 | extract createFibHorizontalLines/createFibConcentricCircles helpers |
| `46378dc` | M9 | pre-build timestamp lookup to avoid O(n²) binary search in calc |
| `1438e06` | M10 | add disposed guard and closure-capture symbol/period in onCleanup |
| `7b6112e` | M11 | remove redundant as const in positionUtils baseline |
| `66b660f` | M12 | export DASH_DASHED from buildStyles, use in AlertLine |
