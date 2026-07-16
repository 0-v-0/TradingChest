# fix/critical-bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix all Critical and High severity audit findings — memory leaks, XSS, calculation bugs, async errors, dead code connections.

**Architecture:** 7 fix tasks targeting specific files. Tasks 1-3 fix resource lifecycle bugs, Task 4 fixes calculation correctness, Task 5 fixes async/reactivity, Tasks 6-7 fix security and dead code connections. **Dependency: Task 1 must complete before Task 2** (dispose() relies on fixed unbind()).

**Tech Stack:** TypeScript, Solid.js 1.6, KLineChart 9.x, Vitest

---

### Task 1: Fix KeyboardShortcutManager.unbind() — Actually Remove Event Listener

- [x] **Step 1: Write failing test — unbind removes listener**

Add to `src/shortcut/__tests__/shortcut.test.ts` inside the `unbind` describe block:

> 实现代码：[`src/shortcut/__tests__/shortcut.test.ts`](src/shortcut/__tests__/shortcut.test.ts) (1-478 行)

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shortcut/__tests__/shortcut.test.ts -t "unbind 后 dispatch 事件不触发 handler"`
Expected: FAIL — handler called 2 times because `unbind()` doesn't remove the listener

- [x] **Step 3: Implement the fix**

In `src/shortcut/index.ts`, add a private field to store the element, and fix `unbind()`:

> 实现代码：[`src/shortcut/index.ts`](src/shortcut/index.ts) (1-127 行)

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shortcut/__tests__/shortcut.test.ts`
Expected: ALL PASS

- [x] **Step 5: Commit**

**验证:** `npx vitest run src/shortcut/__tests__/shortcut.test.ts`

---

### Task 2: Add KLineChartPro.dispose() — Full Resource Cleanup

- [x] **Step 1: Add `dispose()` and `feedPrice()` to ChartPro interface**

In `src/types.ts`, add before the closing `}` of the `ChartPro` interface (before line 116):

> 实现代码：[`src/types.ts`](src/types.ts) (1-150 行)

- [x] **Step 2: Implement dispose() in KLineChartPro**

In `src/KLineChartPro.tsx`, add new private fields after line 171:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Modify the constructor to capture the render() return value. Replace lines 52-84:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Modify `attachClickListener` (line 94-110) to store references:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Modify the MutationObserver block (lines 117-124) to store reference + timeout:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Add the new methods after `getReplayEngine()`:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Also modify `startReplay` to wire alertManager (replace lines 317-321):

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Also add `feedPrice` stub to `ChartProComponent.tsx` ref (inside `props.ref({...})` around line 138):

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

- [x] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: ALL 104 PASS (no existing tests break)

- [x] **Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: No errors

- [x] **Step 5: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 3: Fix adjustFromTo week/month/year Calculations

- [x] **Step 1: Write failing tests for week/month/year**

Add to `src/core/__tests__/adjustFromTo.test.ts`:

> 实现代码：[`src/core/__tests__/adjustFromTo.test.ts`](src/core/__tests__/adjustFromTo.test.ts) (1-81 行)

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/core/__tests__/adjustFromTo.test.ts`
Expected: 4 new tests FAIL

- [x] **Step 3: Fix the adjustFromTo implementation**

Replace the `week`, `month`, and `year` cases in `src/core/adjustFromTo.ts` (lines 47-75):

> 实现代码：[`src/core/adjustFromTo.ts`](src/core/adjustFromTo.ts) (1-78 行)

Also update the existing `minute`/`hour`/`day` cases to use UTC-based `to` snapping for consistency. The `day` case line 43 should also snap to UTC midnight:

> 实现代码：[`src/core/adjustFromTo.ts`](src/core/adjustFromTo.ts) (1-78 行)

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/core/__tests__/adjustFromTo.test.ts`
Expected: ALL PASS (old + new tests)

- [x] **Step 5: Commit**

**验证:** `npx vitest run src/core/__tests__/adjustFromTo.test.ts`

---

### Task 4: Fix Async Error Handling + Loading Signal

- [x] **Step 1: Write failing test for registry loader rejection**

Add to `src/indicator/__tests__/registry.test.ts`:

> 实现代码：[`src/indicator/__tests__/registry.test.ts`](src/indicator/__tests__/registry.test.ts) (1-62 行)

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/indicator/__tests__/registry.test.ts -t "loader rejection"`
Expected: FAIL — second call returns the cached rejected promise

- [x] **Step 3: Fix registry.ts — clear _pending on rejection**

In `src/indicator/registry.ts`, replace lines 47-55:

> 实现代码：[`src/indicator/registry.ts`](src/indicator/registry.ts) (1-47 行)

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/indicator/__tests__/registry.test.ts`
Expected: ALL PASS

- [x] **Step 5: Fix ChartProComponent — loading signal + async errors + XSS**

In `src/ChartProComponent.tsx`:

**5a. Loading signal (line 77):**
Replace `let loading = false` with:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

**5b. All `loading` reads → `loading()`, all `loading = x` → `setLoading(x)`:**
- Line 234: `loading = true` → `setLoading(true)`
- Line 241: `loading = false` → `setLoading(false)`
- Line 306: `if (!loading)` → `if (!loading())`
- Line 312: `loading = true` → `setLoading(true)`
- Line 321: `loading = false` → `setLoading(false)`

**5c. Async error handling in onMount IIFE (lines 220-232):**
Replace with:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

**5d. loadMore error handling (lines 233-244):**
Replace with:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

**5e. Data fetch effect error handling (lines 305-328):**

**IMPORTANT**: `loading()` must NOT be called inside createEffect — it would create a reactive dependency causing infinite re-triggering. Use `untrack()` to read the signal without tracking.

Add `untrack` to the import on line 15:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

Replace the effect:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

**5f. XSS fix (line 207):**
Replace `watermark.innerHTML = str` with `watermark.textContent = str`

**5g. XSS fix (line 297):**
Replace `priceUnitDom.innerHTML = s?.priceCurrency.toLocaleUpperCase()` with `priceUnitDom.textContent = s?.priceCurrency.toLocaleUpperCase()`

- [x] **Step 6: Run all tests + tsc**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL PASS, no type errors

- [x] **Step 7: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 5: WebSocket Message Validation

- [x] **Step 1: Add validation to onmessage handler**

In `src/DefaultDatafeed.ts`, replace the `this.#ws.onmessage` block (lines 89-108):

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

Note: also fix the existing bug on line 96 — the original code checks `'sym' in result` instead of `'sym' in result[0]`. The data field access was also on `result` instead of `result[0]`.

- [x] **Step 2: Run all tests + tsc**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL PASS

- [x] **Step 3: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 6: Connect IndicatorClickDetector via extendData

> **NOTE:** IndicatorClickDetector was implemented then removed. The codebase uses module-level `_hitTargetsMap` with per-instance keys instead. The globalThis problem is solved via instance-scoped maps.

- [x] **Step 1: Update extendData contract**

In `src/indicator/trade/tradeVisualization.ts`:

Add a new interface after `BarTradeInfo` (after line 23):

> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

Replace line 31:

> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

Replace lines 84-85:

> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

Replace line 169 (`(globalThis as any).__tradeVisHitTargets = hitTargets`):

> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

- [x] **Step 2: Update KLineChartPro.tsx to pass clickDetector via extendData**

Currently `KLineChartPro` does not directly create the TradeVis indicator — it is created by consumers via the klinecharts API with `extendData`. However, we need to document the new contract. In `src/KLineChartPro.tsx`, add a helper method after `getClickDetector()` (line 244):

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Also add it to `ChartPro` interface in `src/types.ts`:

> 实现代码：[`src/types.ts`](src/types.ts) (1-150 行)

And add the stub in `ChartProComponent.tsx` ref block:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

- [x] **Step 3: Run all tests + tsc**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL PASS

- [x] **Step 4: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 7: Final Verification + Build

- [x] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [x] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [x] **Step 3: Build**

Run: `npx vite build`
Expected: Build succeeds, bundle size similar to previous (~311KB ES)

- [x] **Step 4: Verify no regressions in existing exports**

Run: `grep -n 'export' src/index.ts` and verify all public API exports are intact.

- [x] **Step 5: Commit any remaining changes if needed, then tag**

git log --oneline -10

Verify 5-6 commits from this branch are present.

**验证:** `npx vitest run && npx tsc --noEmit && npx vite build`
