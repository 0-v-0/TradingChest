import { createSignal, createMemo, type Component, type JSX } from 'solid-js'

export interface SelectDataSourceItem {
  key: string
  text: JSX.Element
}

export interface SelectProps {
  class?: string
  style?: JSX.CSSProperties | string
  value?: JSX.Element
  dataSource?: SelectDataSourceItem[] | string[]
  onSelected?: (data: SelectDataSourceItem | string) => void
}

let _selectId = 0
const nextSelectId = () => `select-listbox-${++_selectId}`

const Select: Component<SelectProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [activeIdx, setActiveIdx] = createSignal(-1)
  const listboxId = nextSelectId()

  const items = createMemo(() =>
    props.dataSource?.map((data) => {
      const d: SelectDataSourceItem =
        typeof data === 'string'
          ? { key: data, text: data }
          : data as SelectDataSourceItem
      const v = d.text
      const isSelected = props.value === v
      return { data, v, isSelected }
    }) ?? [],
  )

  const selectByIndex = (idx: number) => {
    const item = items()[idx]
    if (item && !item.isSelected) {
      props.onSelected?.(item.data)
    }
    setOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const count = items().length
    if (!open()) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        const idx = items().findIndex((it) => it.isSelected)
        setActiveIdx(idx >= 0 ? idx : 0)
        return
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = Math.min(activeIdx() + 1, count - 1)
        setActiveIdx(next)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = Math.max(activeIdx() - 1, 0)
        setActiveIdx(prev)
        break
      }
      case 'Home': {
        e.preventDefault()
        setActiveIdx(0)
        break
      }
      case 'End': {
        e.preventDefault()
        setActiveIdx(count - 1)
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        selectByIndex(activeIdx())
        break
      }
      case 'Escape': {
        e.preventDefault()
        setOpen(false)
        break
      }
    }
  }

  return (
    <div
      style={props.style}
      class={`klinecharts-pro-select ${props.class ?? ''} ${open() ? 'klinecharts-pro-select-show' : ''}`}
      tabIndex={0}
      role="combobox"
      aria-expanded={open()}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      aria-activedescendant={open() && activeIdx() >= 0 ? `${listboxId}-opt-${activeIdx()}` : undefined}
      onClick={() => {
        setOpen((o) => !o)
        if (!open()) return
        const idx = items().findIndex((it) => it.isSelected)
        setActiveIdx(idx >= 0 ? idx : 0)
      }}
      onKeyDown={handleKeyDown}
    >
      <div class="selector-container">
        <span class="value">{props.value}</span>
        <i class="arrow" />
      </div>
      {items().length > 0 && (
        <div class="drop-down-container">
          <ul id={listboxId} role="listbox">
            {items().map(({ v, isSelected }, idx) => (
              <li
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectByIndex(idx)
                }}
              >
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Select
