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

const Select: Component<SelectProps> = (props) => {
  const [open, setOpen] = createSignal(false)

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

  return (
    <div
      style={props.style}
      class={`klinecharts-pro-select ${props.class ?? ''} ${open() ? 'klinecharts-pro-select-show' : ''}`}
      tabIndex="0"
      role="combobox"
      aria-expanded={open()}
      aria-haspopup="listbox"
      onClick={(_val) => {
        setOpen((o) => !o)
      }}
      onBlur={(_val) => {
        setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((o) => !o)
        }
        if (e.key === 'Escape') {
          setOpen(false)
        }
      }}
    >
      <div class="selector-container">
        <span class="value">{props.value}</span>
        <i class="arrow" />
      </div>
      {items().length > 0 && (
        <div class="drop-down-container">
          <ul role="listbox">
            {items().map(({ data, v, isSelected }) => (
              <li
                role="option"
                aria-selected={isSelected}
                tabIndex={open() ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isSelected) {
                    props.onSelected?.(data)
                  }
                  setOpen(false)
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
