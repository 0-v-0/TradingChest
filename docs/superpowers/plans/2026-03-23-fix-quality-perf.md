# fix/quality-perf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve type safety, eliminate dead code, optimize rendering, reduce bundle size.

**Architecture:** 6 tasks. Task 1 replaces lodash (biggest bundle impact). Task 2 deletes dead code. Task 3 optimizes rendering. Task 4 fixes comparison + incrementalCalc + URL encoding. Task 5 cleans @ts-expect-error. Task 6 is final verification. **M7 (MutationObserver timeout) already done in Branch 1.**

**Tech Stack:** TypeScript, Solid.js 1.6, KLineChart 9.x, Vitest

---

### Task 1: Replace lodash with native alternatives (M8)

- [x] **Step 1: Write deepSet test**

Create `src/core/__tests__/deepSet.test.ts`:

> 实现代码：[`src/core/__tests__/deepSet.test.ts`](src/core/__tests__/deepSet.test.ts) (1-29 行)

- [x] **Step 2: Run test — expect FAIL**

Run: `npx vitest run src/core/__tests__/deepSet.test.ts`

- [x] **Step 3: Implement deepSet**

Create `src/core/deepSet.ts`:

> 实现代码：[`src/core/deepSet.ts`](src/core/deepSet.ts) (1-20 行)

- [x] **Step 4: Run test — expect PASS**

Run: `npx vitest run src/core/__tests__/deepSet.test.ts`

- [x] **Step 5: Replace lodash in ChartProComponent.tsx**

Replace imports:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

Replace all `lodashSet(` with `deepSet(`.
Replace all `lodashClone(` with `structuredClone(`.

NOTE: First verify `structuredClone` compatibility — `widget!.getStyles()` returns a plain data object (colors, numbers, strings). No functions or class instances. Safe for structuredClone.

- [x] **Step 6: Replace lodash in setting-modal/index.tsx**

Replace `import lodashSet from 'lodash/set'` with `import { deepSet } from '../../core/deepSet'`.
Replace all `lodashSet(` with `deepSet(`.

- [x] **Step 7: Remove lodash from package.json**

Remove `"lodash": "^4.17.21"` from `dependencies`.
Remove `"@types/lodash": "^4.14.191"` from `devDependencies`.
Run `npm install` to update lock file.

- [x] **Step 8: Verify**

Run: `npx vitest run && npx tsc --noEmit && npx vite build`

- [x] **Step 9: Commit**

**验证:** `npx vitest run && npx tsc --noEmit && npx vite build`

---

### Task 2: Delete Dead Code (M1)

- [x] **Step 1: Delete undoRedo.ts**

rm src/shortcut/undoRedo.ts

- [x] **Step 2: Remove dead shortcut bindings**

In `src/shortcut/defaultBindings.ts`, remove these two entries:

> 实现代码：[`src/shortcut/defaultBindings.ts`](src/shortcut/defaultBindings.ts)

- [x] **Step 3: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 4: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

> **NOTE (2026-07-11):** 本任务曾包含为 `DataCache` 添加 LRU 淘汰（Step 3–4，已随 `DataCache` 一并删除）。`DataCache` 从未集成到 `DefaultDatafeed`，属于 dead code，见 `2026-03-23-quality-and-capability-upgrade.md` Task 3.2。

---

### Task 3: Rendering Performance (M5, M6)

- [x] **Step 1: Merge theme effect's two setStyles into one** — extracted `tooltipIcons()` helper; two `setStyles` calls remain required (KLineChart API does not support combining theme string + partial object in one call), but effect is now much cleaner

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

**For M6**: Move the deep clone to initialization only.

Replace the styles effect (around lines 430-435):

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

And set `widgetDefaultStyles` once during initialization instead (in onMount, after widget is created):
After the widget init block, add:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

(Note: by now `lodashClone` has been replaced with `structuredClone` in Task 1.)

- [x] **Step 2: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 3: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 4: Small Fixes (H8, M2-M4, M10)

- [x] **Step 1: URL encoding**

In `src/DefaultDatafeed.ts`:
- Line with `search=${search ?? ''}` → `search=${encodeURIComponent(search ?? '')}`
- Line with `ticker/${symbol.ticker}/range` → `ticker/${encodeURIComponent(symbol.ticker)}/range`
- Add JSDoc to the class: `/** Demo datafeed for Polygon.io. Production should proxy API calls through a backend. */`

- [x] **Step 2: Comparison tolerance**

In `src/KLineChartPro.tsx`, in `addComparison`, replace:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

And in the `calc` function, replace:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

with tolerance-based matching:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

Also add JSDoc comment above `addComparison`:

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

- [x] **Step 3: incrementalCalc optimization**

In `src/indicator/incrementalCalc.ts`, replace line 76:

> 实现代码：[`src/indicator/incrementalCalc.ts`](src/indicator/incrementalCalc.ts) (1-73 行)

- [x] **Step 4: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 5: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 5: Clean @ts-expect-error (H6, H7)

- [x] **Step 1: Audit all @ts-expect-error locations**

Run `grep -rn '@ts-expect-error' src/` to find all 29 locations. For each:
- If it's accessing a klinecharts internal property not in the type definitions → keep (document why)
- If it's a type that can be fixed with proper casting or interface extension → fix
- If it's from the i18n module → fix with proper Record type

Common patterns to fix:
- `src/i18n/index.ts` — use `Record<string, Record<string, string>>` for locale data
- `src/widget/period-bar/index.tsx` — use proper typing for fullscreen API
- `src/component/select/index.tsx`, `src/component/input/index.tsx` — fix event handler types
- `src/extension/*.ts` — many access `coordinate.dataIndex` or `precision` which are valid klinecharts properties but not in the TS defs. For these, create a type augmentation file or use `(x as any).prop` instead of @ts-expect-error

- [x] **Step 2: Fix what's fixable, leave the rest with explanatory comments**

For each remaining @ts-expect-error that can't be removed, change the comment to explain why:

> 实现代码：[`src/extension/*.ts`](src/extension/*.ts)

- [x] **Step 3: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 4: Commit**

**验证:** `npx vitest run && npx tsc --noEmit`

---

### Task 6: Final Verification + Build

- [x] **Step 1: Run full test suite**

Run: `npx vitest run`

- [x] **Step 2: Type check**

Run: `npx tsc --noEmit`

- [x] **Step 3: Build + compare bundle size**

Run: `npx vite build`
Expected: Bundle size should decrease (lodash removed).

- [x] **Step 4: Verify exports**

Run: `grep -n 'export' src/index.ts`

**验证:** `npx vitest run && npx tsc --noEmit && npx vite build && grep -n 'export' src/index.ts`
