# TradingChest UI/UX Enhancement Design

**Date**: 2026-07-10
**Scope**: 8 UX acceptance items + indicator/drawing favorites + context menu + data window
**Approach**: Independent components with props callbacks, matching existing patterns

---

## 1. Search Box Icon + Clear Button (A4) ✅

### Problem
Indicator modal search input has no search icon or clear button.

### Solution
Replace native `<input>` with existing `<Input>` component which already supports `prefix`/`suffix` slots.

### Changes

**`src/widget/indicator-modal/index.tsx`**:
- Import `Input` from `src/component/input`
- `prefix`: inline SVG search icon
- `suffix`: conditionally render inline SVG close icon when `searchText().length > 0`, onClick clears search
- Removed `onMount` + `searchInputRef` (Input component handles focus internally)

### Status
✅ Implemented. No new i18n keys needed. No new files.

---

## 2. Drawing Cursor (B4) ✅

### Problem
No cursor change when a drawing tool is active.

### Solution
Track drawing mode state, apply CSS class to chart container.

### Changes

**`src/ChartProComponent.tsx`**:
- Add signal: `const [drawingMode, setDrawingMode] = createSignal(false)`
- Set `true` when `widget.createOverlay()` is called
- Set `false` in `onDrawEnd` callback and on Escape cancel
- Add dynamic class: `classList={{ 'klinecharts-pro-drawing': drawingMode() }}`

**`src/base.css`**:
```css
.klinecharts-pro-drawing {
  cursor: crosshair;
}
```

### Status
✅ Implemented.

---

## 3. Delete Drawing Feedback (B5) ✅

### Problem
No visual feedback when a drawing overlay is deleted.

### Solution
Apply flash animation on the property bar delete button before removing overlay.

### Changes

**`src/widget/overlay-property-bar/index.tsx`**:
- Add `deleting` signal
- On delete click: set `deleting(true)`, `setTimeout(150ms)` → `props.onDelete()`
- Apply `deleting` class to delete button

**`src/widget/overlay-property-bar/index.css`**:
```css
&.deleting {
  animation: overlay-delete-flash 150ms ease-out;
}
@keyframes overlay-delete-flash {
  0% { background-color: transparent; }
  50% { background-color: rgba(239, 83, 80, 0.2); }
  100% { background-color: transparent; }
}
```

### Note
Since klinecharts renders overlays on Canvas, CSS animations on overlay DOM elements are not possible. The fade-out effect is applied to the property bar delete button instead, as the fallback approach described in the original design.

### Status
✅ Implemented (fallback approach: property bar button flash).

---

## 4. Indicator Favorites ✅

### Storage
New file `src/core/favorites.ts` — pure localStorage utility.

```ts
const STORAGE_KEY = 'trading-chest-favorites'

interface Favorites {
  indicators: string[]
  tools: string[]
}

function load(): Favorites
function save(f: Favorites): void
function getFavoriteIndicators(): string[]
function addFavoriteIndicator(name: string): void
function removeFavoriteIndicator(name: string): void
function isFavoriteIndicator(name: string): boolean
// Same for tools
function getFavoriteTools(): string[]
function addFavoriteTool(name: string): void
function removeFavoriteTool(name: string): void
function isFavoriteTool(name: string): boolean
```

### UI Changes

**`src/widget/indicator-modal/index.tsx`**:
- Add inline SVG star icon (filled when favorited, outline when not)
- Add `favVersion` signal for reactivity (localStorage reads are not reactive)
- Add "favorites" tab in category tabs, filtering to `getFavoriteIndicators()`
- Clicking star toggles favorite via `addFavoriteIndicator`/`removeFavoriteIndicator`
- `CATEGORY_KEYS` updated to `['all', 'favorites', 'trend', 'volatility', 'volume', 'momentum', 'other']`

**i18n keys** (add to all 4 locale .ini files):
- `indicator_favorites` = "收藏" / "Favorites" / "お気に入り" / "즐겨찾기"

### Status
✅ Implemented.

---

## 5. Drawing Tool Favorites ✅

### Storage
Same `src/core/favorites.ts` file, `tools` array.

### UI Changes

**`src/widget/drawing-bar/index.tsx`**:
- Add a favorites group at the top of the drawing bar (before existing groups)
- Only visible when `getFavoriteTools().length > 0`
- Each favorited tool shows its icon in the favorites group
- Right-click any tool icon → toggle favorite (add/remove)
- Right-click favorite item → remove from favorites

**`src/widget/drawing-bar/index.css`**:
- Added `.favorites-group` flex column layout

**i18n keys**:
- `add_to_favorites` = "添加收藏" / "Add to favorites" / "お気に入りに追加" / "즐겨찾기 추가"
- `remove_from_favorites` = "取消收藏" / "Remove from favorites" / "お気に入りから削除" / "즐겨찾기 제거"

### Deviation from Design
The original design specified "Long-press or right-click" for toggling favorites. Only right-click was implemented since long-press is primarily a mobile interaction and this is a desktop charting application.

### Status
✅ Implemented.

---

## 6. Overlay Context Menu ✅

### New Component: `src/widget/context-menu/`

**`index.tsx`**:
```tsx
interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

interface MenuItem {
  label: string
  icon?: string
  danger?: boolean     // red highlight for destructive actions
  disabled?: boolean
  onClick: () => void
}
```

- Renders as a floating `<div>` at `(x, y)` with menu items
- Click outside or Escape closes
- Position clamped to viewport bounds
- Uses CSS variables for theming

**`index.css`**:
- Fixed position overlay
- Dark/light theme support via CSS variables
- Item hover highlight, danger item red styling
- Box shadow and border radius matching existing modal styles

### Integration: Overlay Right-Click

**`src/ChartProComponent.tsx`**:
- Add signal: `const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; items: MenuItem[] } | null>(null)`
- Add `onRightClick` callback to overlay creation in `DrawingBar` integration
- `handleOverlayRightClick()` builds menu items based on overlay type
- Replace `window.prompt` in textAnnotation/callout/note with "Edit" menu item

**Menu items for overlay**:
| Item | Condition | Action |
|------|-----------|--------|
| 编辑 | textAnnotation/callout/note only | Open window.prompt for text edit |
| 锁定/解锁 | always | Toggle overlay lock |
| 复制 | always | Clone overlay at same position |
| 删除 | always | Remove with flash feedback |

**`src/extension/textAnnotation.ts`**, **`callout.ts`**, **`note.ts`**:
- Changed `onRightClick` to `return false` — lets ChartProComponent handle context menu
- Moved `window.prompt` logic to ChartProComponent context menu handler

### Deviation from Design
"上移一层" and "下移一层" (Bring Forward / Send Backward) were not implemented because klinecharts does not provide a z-order API for overlays. The overlay rendering order is determined internally by the engine.

**i18n keys**:
- `menu_edit` = "编辑" / "Edit" / "編集" / "편집"
- `menu_lock` = "锁定" / "Lock" / "ロック" / "잠금"
- `menu_unlock` = "解锁" / "Unlock" / "ロック解除" / "잠금 해제"
- `menu_copy` = "复制" / "Copy" / "コピー" / "복사"
- `menu_bring_forward` = "上移一层" / "Bring Forward" / "前面へ" / "앞으로" ⚠️ Key added but not used in UI
- `menu_send_backward` = "下移一层" / "Send Backward" / "背面へ" / "뒤로" ⚠️ Key added but not used in UI
- `menu_delete` = "删除" / "Delete" / "削除" / "삭제"

### Status
✅ Implemented (without z-order items due to engine limitation).

---

## 7. Data Window ✅

### New Component: `src/widget/data-window/`

**`index.tsx`**:
```tsx
interface DataWindowRow {
  label: string
  value: string
  color?: string
}

interface DataWindowProps {
  locale: string
  visible: boolean
  onToggle: () => void
  data: DataWindowRow[]
}
```

- Side panel on the right side of the chart (200px width)
- Collapsible: toggle button in period-bar
- Header with title + close button
- Displays OHLCV + main indicator values at current crosshair position
- Slide-in animation

**`index.css`**:
- Fixed width panel, slide-in/out transition
- Dark/light theme via CSS variables
- Compact row layout: label + value per line

### Data Source

**`src/ChartProComponent.tsx`**:
- Subscribe to klinecharts `ActionType.OnCrosshairChange`
- Extract OHLCV from candle data at crosshair index
- Extract main indicator values via `widget.getIndicatorByPaneId('candle_pane')`
- Pass data to DataWindow component via `dataWindowData` signal

### Toggle Button

**`src/widget/period-bar/index.tsx`**:
- Added `dataWindowActive` and `onDataWindowClick` props
- Added data window toggle icon button (table icon) with active state
- Chart resizes on toggle via `setTimeout(() => widget?.resize(), 0)`

### Layout
**`src/index.css`**:
- Added CSS rules for `data-data-window-visible` attribute to adjust chart width

**i18n keys**:
- `data_window` = "数据窗口" / "Data Window" / "データウィンドウ" / "데이터 창"

### Deviation from Design
The original design mentioned extracting indicator values from all panes. Currently only main (candle_pane) indicator values are extracted. Sub-indicator pane values are not easily accessible via the klinecharts API and would require iterating `getDataList()` which is not straightforward. This can be enhanced in a follow-up.

### Status
✅ Implemented (main pane indicators only; sub-indicator values can be added later).

---

## 8. Legend Hover Highlight ⚠️ Skipped

### Problem
Hovering over indicator legend text should highlight the corresponding indicator line on the chart.

### Investigation Result
- klinecharts only provides `ActionType.OnTooltipIconClick` — no hover callback for legend/tooltip icons
- Indicator tooltip area is rendered on Canvas with no accessible DOM elements for mouse events
- No `onTooltipIconHover` or equivalent API exists in klinecharts

### Conclusion
This feature is not feasible without engine changes to klinecharts. Marked as engine limitation.

### Status
⚠️ Skipped — engine limitation.

---

## File Changes Summary

| File | Action | Description | Status |
|------|--------|-------------|--------|
| `src/core/favorites.ts` | **NEW** | Favorites localStorage utility | ✅ |
| `src/widget/context-menu/index.tsx` | **NEW** | Context menu component | ✅ |
| `src/widget/context-menu/index.css` | **NEW** | Context menu styles | ✅ |
| `src/widget/data-window/index.tsx` | **NEW** | Data window panel | ✅ |
| `src/widget/data-window/index.css` | **NEW** | Data window styles | ✅ |
| `src/ChartProComponent.tsx` | MODIFY | Drawing mode signal, context menu state, data window data, crosshair subscription | ✅ |
| `src/widget/indicator-modal/index.tsx` | MODIFY | Use Input component, add favorites tab and star icons | ✅ |
| `src/widget/drawing-bar/index.tsx` | MODIFY | Add favorites group | ✅ |
| `src/widget/period-bar/index.tsx` | MODIFY | Add data window toggle button | ✅ |
| `src/widget/overlay-property-bar/index.tsx` | MODIFY | Add delete flash animation | ✅ |
| `src/extension/textAnnotation.ts` | MODIFY | Remove window.prompt from onRightClick | ✅ |
| `src/extension/callout.ts` | MODIFY | Same | ✅ |
| `src/extension/note.ts` | MODIFY | Same | ✅ |
| `src/base.css` | MODIFY | Add .klinecharts-pro-drawing cursor rule | ✅ |
| `src/index.css` | MODIFY | Add data-window-visible width rules | ✅ |
| `src/widget/index.tsx` | MODIFY | Export ContextMenu, DataWindow | ✅ |
| `src/widget/index.css` | MODIFY | Import context-menu and data-window CSS | ✅ |
| `src/i18n/*.ini` | MODIFY | Add new i18n keys (4 locales) | ✅ |

---

## Implementation Order (Actual)

1. **A4**: Search icon + clear button — ✅
2. **B4**: Drawing cursor — ✅
3. **B5**: Delete feedback — ✅ (fallback: property bar button flash)
4. **Favorites**: Core utility first, then indicator modal, then drawing bar — ✅
5. **Context menu**: Component first, then overlay integration — ✅ (without z-order items)
6. **Data window**: Component + crosshair subscription — ✅ (main pane only)
7. **Legend hover**: ⚠️ Skipped — engine limitation

---

## Known Limitations

1. **Delete overlay fade-out**: Canvas-rendered overlays cannot be animated via CSS. Only the property bar delete button shows feedback. A true fade-out would require klinecharts to support dynamic overlay opacity changes.
2. **Overlay z-order**: "Bring Forward" / "Send Backward" not implemented — klinecharts has no API for overlay z-order control.
3. **Data window sub-indicators**: Only main pane (candle_pane) indicator values are shown. Sub-indicator pane values require additional API exploration.
4. **Legend hover highlight**: Not feasible without klinecharts engine changes.
