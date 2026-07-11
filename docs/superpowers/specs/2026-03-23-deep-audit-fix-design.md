# TradingChest Deep Audit Fix — Design Spec

**Date**: 2026-03-23 | **Last updated**: 2026-07-11
**Scope**: Full fix of 25 audit findings + test coverage gaps
**Strategy**: 3 sequential feature branches by severity dimension

---

## Branch 1: `fix/critical-bugs` — Core Defect Fixes ✅ 已完成

**Scope**: C1-C5 + H1-H5 (10 issues)
**Goal**: Eliminate all memory leaks, XSS vectors, calculation bugs, dead code connections, and async error handling gaps.
**Status**: 已在 2026-03-24 ~ 2026-03-25 三轮深度审查中全部完成

### 1.1 KLineChartPro.dispose() + Resource Cleanup (C1, C2) ✅

**KLineChartPro.tsx**:
- ✅ Store `render()` return value: `this._solidDispose = render(...)`
- ✅ Store click listener reference + bound element for later `removeEventListener`
- ✅ Store `MutationObserver` reference
- ✅ Add `dispose()` method that cleans up in order:
  1. Stop and dispose replay engine
  2. Clear alert manager
  3. Unbind shortcut manager
  4. Remove click event listener from widget element
  5. Disconnect MutationObserver
  6. Call `this._solidDispose()`
  7. Remove container CSS class

**shortcut/index.ts**:
- ✅ `bindTo()`: save `this._element` reference
- ✅ `unbind()`: call `this._element.removeEventListener('keydown', this.handler)` then null both references

### 1.2 adjustFromTo Calculation Fix (C3) ✅

**core/adjustFromTo.ts** — all three broken cases fixed:
- ✅ `week`: ms conversion + absolute from value corrected
- ✅ `month`: Rewritten with `Date` arithmetic (`d.setMonth(d.getMonth() - count * period.multiplier)`)
- ✅ `year`: Rewritten with `Date` arithmetic (`d.setFullYear(d.getFullYear() - count * period.multiplier)`)
- ✅ Unit tests for all week/month/year branches

### 1.3 Async Error Handling + Loading Signal (C4, C5) ✅

**ChartProComponent.tsx**:
- ✅ `loading` converted to `createSignal(false)`
- ✅ `onMount` async IIFE: error catch added
- ✅ `loadMore` `get()`: catch + finally added
- ✅ `createEffect` data fetch: try/catch + finally

**indicator/registry.ts**:
- ✅ `ensureRegistered`: loader rejection clears `_pending` map for retry

### 1.4 XSS Fix (H1, H2) ✅

**ChartProComponent.tsx**:
- ✅ `watermark.innerHTML` → `watermark.textContent`
- ✅ `priceUnitDom.innerHTML` → `priceUnitDom.textContent`

### 1.5 WebSocket Message Validation (H3) ✅

**DefaultDatafeed.ts**:
- ✅ `JSON.parse(event.data)` wrapped in try/catch
- ✅ Validate `result` is Array and `result.length > 0`
- ✅ Validate numeric fields are typeof number

### 1.6 Connect AlertManager (H4) ✅

- ✅ `feedPrice(price: number)` public method implemented
- ✅ AlertLine overlay registered
- ✅ AlertManager with crossing/above/below conditions
- ✅ Reset on symbol/period change

### 1.7 Connect IndicatorClickDetector (H5) ✅

- ✅ `globalThis.__tradeVisHitTargets` removed
- ✅ `extendData` shape changed to `{ trades: TradeRecord[], clickDetector: IndicatorClickDetector }`
- ✅ TradeVis indicator reads from new data shape

---

## Branch 2: `fix/quality-perf` — Quality & Performance ✅ 已完成

**Scope**: H6-H8 + M1-M8, M10, M12 (13 issues)
**Goal**: Improve type safety, eliminate dead code, optimize rendering, reduce bundle size.
**Status**: 已在 2026-03-25 + 2026-07-08~09 重构中完成

### 2.1 Type Safety (H6, H7) ✅

- ✅ `@ts-expect-error` 数量大幅减少
- ✅ Key `any` types narrowed (IndicatorClickEvent.data → TradeHitData, buildStyles → DeepPartial)
- ✅ TypeScript 升级到 v6

### 2.2 API Key Security + URL Encoding (H8) ✅

**DefaultDatafeed.ts**:
- ✅ `encodeURIComponent()` applied
- ✅ JSDoc warning added

### 2.3 Dead Code Cleanup (M1) ✅

- ❌ ~~**DataCache**~~: 曾实现 LRU 淘汰，但从未集成到 `DefaultDatafeed`；2026-07-11 作为 dead code 删除（`src/datafeed/DataCache.ts` + 测试）
- ✅ **UndoRedoManager**: Deleted (`src/shortcut/undoRedo.ts` removed)
- ✅ Dead shortcut bindings (`chart:undo` / `chart:redo`) removed from `defaultBindings.ts`

### 2.4 Comparison Fixes (M2, M3, M4) ✅

- ✅ Timestamp matching with ±60000ms tolerance
- ✅ `removeComparison` documented with klinecharts global registry limitation
- ✅ Incremental update limitation documented

### 2.5 Rendering Performance (M5, M6) ✅

- ✅ Theme effect's `setStyles()` calls merged
- ✅ `lodashClone(widget!.getStyles())` moved to initialization only

### 2.6 MutationObserver Timeout (M7) ✅

- ✅ 3-second `setTimeout` safety net with `observer.disconnect()`
- ✅ `dispose()` clears timeout before disconnecting observer

### 2.7 lodash Replacement (M8) ✅

- ✅ `lodash/cloneDeep` → `structuredClone()`
- ✅ `lodash/set` → custom `deepSet()` utility in `src/core/deepSet.ts` (~15 lines, 原型污染防护)
- ✅ `lodash` removed from `package.json` dependencies

### 2.8 incrementalCalc Optimization (M10) ✅

- ✅ In-place mutation: `cached.length = startIdx; cached.push(...tailResult)`

### 2.9 Dependency Updates (M12) ✅

- ✅ Vite 8, TypeScript 6, Vitest 4, ESLint 10
- ✅ React dependencies removed (solid-js only)
- ✅ Less preprocessor removed (native CSS only)
- ✅ i18n format migrated from JSON to INI with lazy loading

---

## Branch 3: `fix/test-coverage` — Test Coverage ✅ 已完成

**Scope**: Zero-coverage modules + weak coverage edge cases + integration tests
**Goal**: Bring all critical code paths under test.
**Status**: 已在 2026-03-25 完成主要测试文件, 16 个单元测试文件 + 2 个集成测试文件现已存在

### 3.1 New Test Files — Zero Coverage Core Modules ✅

| Test File | Target | Status |
|-----------|--------|--------|
| `indicator/utils/__tests__/utils.test.ts` | 12 math functions | ✅ 存在 |
| `datafeed/__tests__/ReconnectingWebSocket.test.ts` | 重写后测试实际类 | ✅ 存在 |
| ~~`datafeed/__tests__/DataCache.test.ts`~~ | ~~LRU cache~~ | ❌ 已删除 (DataCache 未集成且已删) |
| ~~`shortcut/__tests__/undoRedo.test.ts`~~ | ~~UndoRedoManager~~ | ❌ 已删除 (UndoRedoManager 已删) |
| `export/__tests__/export.test.ts` | exportToCSV, exportScreenshot | ✅ 存在 |

### 3.2 Edge Case Additions — Weak Coverage Modules ✅

| Test File | Added Cases | Status |
|-----------|-------------|--------|
| `core/__tests__/adjustFromTo.test.ts` | week/month/year branches | ✅ 存在 |
| `alert/__tests__/alert.test.ts` | below, resetAll, idempotency | ✅ 存在 |
| `replay/__tests__/ReplayEngine.test.ts` | edge positions, dispose | ✅ 存在 |
| `compare/__tests__/compare.test.ts` | basePrice===0, single element | ✅ 存在 |
| `indicator/__tests__/registry.test.ts` | loader rejection clears _pending | ✅ 存在 |
| `indicator/__tests__/superTrend.test.ts` | reversal dataset | ✅ 存在 |

### 3.3 New Module Tests ✅

| Test File | Target | Status |
|-----------|--------|--------|
| `core/__tests__/deepSet.test.ts` | deepSet utility | ✅ 存在 |
| `i18n/__tests__/i18n.test.ts` | Missing key fallback, load override | ✅ 存在 |

### 3.4 Integration Tests ✅

| Test File | Scenario | Status |
|-----------|----------|--------|
| `__tests__/integration/replay-data-flow.test.ts` | ReplayEngine data flow | ✅ 存在 |
| `__tests__/integration/alert-price-stream.test.ts` | Tick stream through checkPrice | ✅ 存在 |

### 3.5 Fix Test Anti-Patterns ✅

- ✅ `ReconnectingWebSocket.test.ts`: Rewritten to test actual class
- ✅ `shortcut.test.ts`: Improved assertions
- ✅ `superTrend.test.ts`: Reversal dataset added

---

## Current Test Inventory (16 unit + 2 integration)

| File | Target |
|------|--------|
| `alert/__tests__/alert.test.ts` | AlertManager |
| `compare/__tests__/compare.test.ts` | normalizeToPercent |
| `core/__tests__/adjustFromTo.test.ts` | Date range calc |
| `core/__tests__/buildStyles.test.ts` | Style builder |
| `core/__tests__/deepSet.test.ts` | Deep object setter |
| `datafeed/__tests__/ReconnectingWebSocket.test.ts` | WebSocket reconnection |
| `export/__tests__/export.test.ts` | CSV/screenshot export |
| `i18n/__tests__/i18n.test.ts` | i18n loading |
| `indicator/__tests__/incrementalCalc.test.ts` | Incremental calc |
| `indicator/__tests__/registry.test.ts` | Lazy indicator registry |
| `indicator/__tests__/superTrend.test.ts` | SuperTrend indicator |
| `indicator/__tests__/utils.test.ts` | Indicator utilities |
| `indicator/trade/__tests__/tradeVisualization.test.ts` | Trade visualization |
| `persistence/__tests__/persistence.test.ts` | Layout save/load |
| `shortcut/__tests__/shortcut.test.ts` | Keyboard shortcuts |
| `replay/__tests__/ReplayEngine.test.ts` | Replay engine |
| `__tests__/integration/replay-data-flow.test.ts` | ReplayEngine data flow |
| `__tests__/integration/alert-price-stream.test.ts` | Tick stream through checkPrice |

---

## Remaining Gaps (Post-Audit)

以下问题在审计修复后仍存在或新发现:

1. **UndoRedoManager 重建**: 已删除但功能需求仍在, 需基于 Command Pattern 重新设计
2. **Datafeed 层缓存**: `DataCache` 已删除（未集成、设计不匹配 `from/to` 区间查询）；若需减少 API 调用，应按区间缓存重新设计
3. **图表类型不足**: Renko/Kagi/P&F/Line Break 未实现
4. **指标数量**: 80 (53 自定义 + 27 内置) ✅ 已达标（详见 [2026-07-10-indicator-expansion-design.md](./2026-07-10-indicator-expansion-design.md)）
5. **Session Breaks**: 盘前盘后分隔线未实现
6. **主题编辑器**: 无可视化编辑界面
7. **指标/工具收藏**: ✅ 已实现（详见 [2026-07-10-ux-enhancement-design.md](./2026-07-10-ux-enhancement-design.md)）

## Out of Scope

- Major dependency upgrades ✅ (Vite 8, TS 6 已完成)
- Multi-chart layout feature (P1 from original roadmap)
- Scripting engine (P3 from original roadmap)
- `solid-js` → peerDependency migration (breaking change for consumers)
