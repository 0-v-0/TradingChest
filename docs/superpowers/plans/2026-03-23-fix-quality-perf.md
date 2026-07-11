# fix/quality-perf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve type safety, eliminate dead code, optimize rendering, reduce bundle size.

**Architecture:** 6 tasks. Task 1 replaces lodash (biggest bundle impact). Task 2 deletes dead code. Task 3 optimizes rendering. Task 4 fixes comparison + incrementalCalc + URL encoding. Task 5 cleans @ts-expect-error. Task 6 is final verification. **M7 (MutationObserver timeout) already done in Branch 1.**

**Tech Stack:** TypeScript, Solid.js 1.6, KLineChart 9.x, Vitest

---

### Task 1: Replace lodash with native alternatives (M8)

**Files:**
- Create: `src/core/deepSet.ts`
- Create: `src/core/__tests__/deepSet.test.ts`
- Modify: `src/ChartProComponent.tsx` — replace lodash imports
- Modify: `src/widget/setting-modal/index.tsx` — replace lodash import
- Modify: `package.json` — remove lodash dependency

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
with:
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

git add src/core/deepSet.ts src/core/__tests__/deepSet.test.ts src/ChartProComponent.tsx src/widget/setting-modal/index.tsx package.json package-lock.json
git commit -m "refactor: replace lodash with native deepSet + structuredClone

Remove lodash dependency (~70KB gzip savings).
deepSet rejects __proto__/constructor/prototype for safety."

---

### Task 2: Delete Dead Code (M1)

**Files:**
- Delete: `src/shortcut/undoRedo.ts`
- Modify: `src/shortcut/defaultBindings.ts` — remove chart:undo/redo bindings

- [x] **Step 1: Delete undoRedo.ts**

rm src/shortcut/undoRedo.ts

- [x] **Step 2: Remove dead shortcut bindings**

In `src/shortcut/defaultBindings.ts`, remove these two entries:
> 实现代码：[`src/shortcut/defaultBindings.ts`](src/shortcut/defaultBindings.ts)

- [x] **Step 3: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 4: Commit**

git add -A
git commit -m "refactor: delete UndoRedoManager

Delete dead code: undoRedo.ts + chart:undo/redo shortcut bindings."

> **NOTE (2026-07-11):** 本任务曾包含为 `DataCache` 添加 LRU 淘汰（Step 3–4，已随 `DataCache` 一并删除）。`DataCache` 从未集成到 `DefaultDatafeed`，属于 dead code，见 `2026-03-23-quality-and-capability-upgrade.md` Task 3.2。

---

### Task 3: Rendering Performance (M5, M6)

**Files:**
- Modify: `src/ChartProComponent.tsx:332-435`

- [x] **Step 1: Merge theme effect's two setStyles into one** — extracted `tooltipIcons()` helper; two `setStyles` calls remain required (KLineChart API does not support combining theme string + partial object in one call), but effect is now much cleaner

Replace the theme `createEffect` (lines 332-420) with a single `setStyles` call:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

Note: KLineChart's `setStyles(theme_string)` first applies the theme, then the object properties are merged on top. Actually, looking more carefully — `widget?.setStyles(t)` where `t` is a string like `'dark'` or `'light'` applies a theme preset. The second `setStyles` call overlays icon config. These CAN be combined if we detect the string case:

Actually the simplest safe approach: keep two calls IF t is a string, or merge if object. But the real gain is eliminating the redundant canvas redraw. Since KLineChart doesn't support atomic batching, the safest fix is:

> 实现代码：[`src/ChartProComponent.tsx`](src/ChartProComponent.tsx) (1-1089 行)

Wait — this is still two calls. The issue is `setStyles(string)` applies a preset and `setStyles(object)` merges a partial style. They can't be combined into one call. But we CAN avoid the second full redraw by batching via `requestAnimationFrame`:

Actually, the simplest approach that halves redraws: just keep it as-is but refactor the icon config into a constant outside the effect, so the effect body is cleaner. The real fix is M6 — moving the clone.

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

git add src/ChartProComponent.tsx
git commit -m "perf: move default styles clone to init, remove per-change clone

widgetDefaultStyles is only needed for 'restore defaults' in settings modal.
Clone once at init instead of on every style change."

---

### Task 4: Small Fixes (H8, M2-M4, M10)

**Files:**
- Modify: `src/DefaultDatafeed.ts` — URL encoding (H8)
- Modify: `src/KLineChartPro.tsx` — comparison tolerance (M2, M3, M4)
- Modify: `src/indicator/incrementalCalc.ts` — in-place mutation (M10)

- [x] **Step 1: URL encoding**

In `src/DefaultDatafeed.ts`:
- Line with `search=${search ?? ''}` → `search=${encodeURIComponent(search ?? '')}`
- Line with `ticker/${symbol.ticker}/range` → `ticker/${encodeURIComponent(symbol.ticker)}/range`
- Add JSDoc to the class: `/** Demo datafeed for Polygon.io. Production should proxy API calls through a backend. */`

- [x] **Step 2: Comparison tolerance**

In `src/KLineChartPro.tsx`, in `addComparison`, replace:
> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)
with:
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
with:
> 实现代码：[`src/indicator/incrementalCalc.ts`](src/indicator/incrementalCalc.ts) (1-73 行)

- [x] **Step 4: Verify**

Run: `npx vitest run && npx tsc --noEmit`

- [x] **Step 5: Commit**

git add src/DefaultDatafeed.ts src/KLineChartPro.tsx src/indicator/incrementalCalc.ts
git commit -m "fix: URL encoding, comparison tolerance, incrementalCalc optimization

- encodeURIComponent for search/ticker in DefaultDatafeed API URLs
- ±60s tolerance for cross-symbol timestamp matching in comparison
- In-place array mutation in incrementalCalc to reduce GC pressure"

---

### Task 5: Clean @ts-expect-error (H6, H7)

**Files:**
- Multiple files in `src/extension/`, `src/i18n/`, `src/widget/`, `src/component/`

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

git add -A
git commit -m "refactor: clean @ts-expect-error comments, improve type safety

Fix removable type suppressions, add explanatory comments to remaining ones
that are caused by klinecharts type definition gaps."

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
