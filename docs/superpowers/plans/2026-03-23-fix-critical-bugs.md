# fix/critical-bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix all Critical and High severity audit findings — memory leaks, XSS, calculation bugs, async errors, dead code connections.

**Architecture:** 7 fix tasks targeting specific files. Tasks 1-3 fix resource lifecycle bugs, Task 4 fixes calculation correctness, Task 5 fixes async/reactivity, Tasks 6-7 fix security and dead code connections. **Dependency: Task 1 must complete before Task 2** (dispose() relies on fixed unbind()).

**Tech Stack:** TypeScript, Solid.js 1.6, KLineChart 9.x, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/shortcut/index.ts` | Fix unbind() to actually remove event listener |
| Modify | `src/shortcut/__tests__/shortcut.test.ts` | Add unbind verification tests |
| Modify | `src/KLineChartPro.tsx` | Add dispose(), store cleanup refs, connect AlertManager + ClickDetector |
| Modify | `src/types.ts` | Add dispose() + feedPrice() to ChartPro interface |
| Modify | `src/core/adjustFromTo.ts` | Fix week/month/year calculation bugs |
| Modify | `src/core/__tests__/adjustFromTo.test.ts` | Add week/month/year tests |
| Modify | `src/ChartProComponent.tsx` | Fix loading signal, async errors, XSS |
| Modify | `src/indicator/registry.ts` | Clear _pending on loader rejection |
| Modify | `src/indicator/__tests__/registry.test.ts` | Test rejection cleanup |
| Modify | `src/DefaultDatafeed.ts` | WebSocket message validation |
| Modify | `src/indicator/trade/tradeVisualization.ts` | Replace globalThis with extendData injection |
| Modify | `src/alert/index.ts` | Add checkPrice timestamp default |

---

### Task 1: Fix KeyboardShortcutManager.unbind() — Actually Remove Event Listener

**Files:**
- Modify: `src/shortcut/index.ts:7-121`
- Test: `src/shortcut/__tests__/shortcut.test.ts`

- [x] **Step 1: Write failing test — unbind removes listener**

Add to `src/shortcut/__tests__/shortcut.test.ts` inside the `unbind` describe block:

> 实现代码：[`src/shortcut/__tests__/shortcut.test.ts`](src/shortcut/__tests__/shortcut.test.ts) (1-478 行)

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shortcut/__tests__/shortcut.test.ts -t "unbind 后 dispatch 事件不触发 handler"`
Expected: FAIL — handler called 2 times because `unbind()` doesn't remove the listener

- [x] **Step 3: Implement the fix**

In `src/shortcut/index.ts`, add a private field to store the element, and fix `unbind()`:

Replace lines 8-11:
> 实现代码：[`src/shortcut/index.ts`](src/shortcut/index.ts) (1-127 行)
with:
> 实现代码：[`src/shortcut/index.ts`](src/shortcut/index.ts) (1-127 行)

Replace the `bindTo` method (lines 89-112):
> 实现代码：[`src/shortcut/index.ts`](src/shortcut/index.ts) (1-127 行)

Replace the `unbind` method (lines 117-121):
> 实现代码：[`src/shortcut/index.ts`](src/shortcut/index.ts) (1-127 行)

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shortcut/__tests__/shortcut.test.ts`
Expected: ALL PASS

- [x] **Step 5: Commit**

git add src/shortcut/index.ts src/shortcut/__tests__/shortcut.test.ts
git commit -m "fix: KeyboardShortcutManager.unbind() now removes event listener

Store element reference in bindTo(), call removeEventListener in unbind().
Fixes memory leak where keydown listeners accumulated on rebind."

---

### Task 2: Add KLineChartPro.dispose() — Full Resource Cleanup

**Files:**
- Modify: `src/KLineChartPro.tsx:39-337`
- Modify: `src/types.ts:77-116`

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

git add src/KLineChartPro.tsx src/types.ts src/ChartProComponent.tsx
git commit -m "fix: add KLineChartPro.dispose() for full resource cleanup

Captures Solid render dispose, click listener refs, MutationObserver,
and observer timeout ID. dispose() cleans up in order: replay → alerts
→ shortcuts → click listener → observer → Solid → container.
Also wires AlertManager.checkPrice into replay onBarUpdate callback
and adds feedPrice() public method for live alert checking."

---

### Task 3: Fix adjustFromTo week/month/year Calculations

**Files:**
- Modify: `src/core/adjustFromTo.ts:47-75`
- Test: `src/core/__tests__/adjustFromTo.test.ts`

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

Replace lines 42-45:
> 实现代码：[`src/core/adjustFromTo.ts`](src/core/adjustFromTo.ts) (1-78 行)

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/core/__tests__/adjustFromTo.test.ts`
Expected: ALL PASS (old + new tests)

- [x] **Step 5: Commit**

git add src/core/adjustFromTo.ts src/core/__tests__/adjustFromTo.test.ts
git commit -m "fix: adjustFromTo week/month/year calculation bugs

Week: add missing *1000 ms conversion, compute from as offset not absolute.
Month: use Date.setUTCMonth for calendar-aware subtraction (handles variable month lengths).
Year: use Date.setUTCFullYear for leap-year-safe subtraction.
Day: snap to UTC midnight instead of hour boundary."

---

### Task 4: Fix Async Error Handling + Loading Signal

**Files:**
- Modify: `src/ChartProComponent.tsx:77,207,220-232,233-243,297,305-328`
- Modify: `src/indicator/registry.ts:47-56`
- Test: `src/indicator/__tests__/registry.test.ts`

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

git add src/ChartProComponent.tsx src/indicator/registry.ts src/indicator/__tests__/registry.test.ts
git commit -m "fix: async error handling, loading signal, XSS, registry retry

- Convert loading to createSignal for proper Solid.js reactivity
- Add .catch() to all fire-and-forget async calls
- Add .finally() to reset loading state on failure
- Replace innerHTML with textContent (2 XSS vectors)
- Clear _pending on loader rejection so retry is possible"

---

### Task 5: WebSocket Message Validation

**Files:**
- Modify: `src/DefaultDatafeed.ts:89-108`

- [x] **Step 1: Add validation to onmessage handler**

In `src/DefaultDatafeed.ts`, replace the `this._ws.onmessage` block (lines 89-108):

> 实现代码：[`src/DefaultDatafeed.ts`](src/DefaultDatafeed.ts) (1-189 行)

Note: also fix the existing bug on line 96 — the original code checks `'sym' in result` instead of `'sym' in result[0]`. The data field access was also on `result` instead of `result[0]`.

- [x] **Step 2: Run all tests + tsc**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL PASS

- [x] **Step 3: Commit**

git add src/DefaultDatafeed.ts
git commit -m "fix: validate WebSocket messages before processing

Wrap JSON.parse in try/catch, validate result is array,
check numeric field types before creating KLineData callback."

---

### Task 6: Connect IndicatorClickDetector via extendData

> **NOTE:** IndicatorClickDetector was implemented then removed. The codebase uses module-level `_hitTargetsMap` with per-instance keys instead. The globalThis problem is solved via instance-scoped maps.

**Files:**
- Modify: `src/indicator/trade/tradeVisualization.ts:30-31,80-85,167-169`

- [x] **Step 1: Update extendData contract**

In `src/indicator/trade/tradeVisualization.ts`:

Add a new interface after `BarTradeInfo` (after line 23):
> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

Replace line 31:
> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)
with:
> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)

Replace lines 84-85:
> 实现代码：[`src/indicator/trade/tradeVisualization.ts`](src/indicator/trade/tradeVisualization.ts) (1-247 行)
with:
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

git add src/indicator/trade/tradeVisualization.ts src/KLineChartPro.tsx src/types.ts src/ChartProComponent.tsx
git commit -m "fix: replace globalThis.__tradeVisHitTargets with extendData injection

TradeVis indicator now reads clickDetector from extendData.
Supports both old TradeRecord[] and new TradeVisExtendData shape
for backwards compatibility."

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
