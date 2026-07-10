import { Component, Show, onCleanup, onMount } from 'solid-js'

export interface MenuItem {
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
}

export interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

const ContextMenu: Component<ContextMenuProps> = (props) => {
  const handleClickOutside = (_e: MouseEvent) => {
    props.onClose()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside, true)
    document.removeEventListener('keydown', handleKeyDown)
  })

  // Clamp position to viewport
  const menuWidth = 160
  const menuHeight = props.items.length * 32 + 8
  const x = Math.min(props.x, window.innerWidth - menuWidth - 8)
  const y = Math.min(props.y, window.innerHeight - menuHeight - 8)

  return (
    <div class="klinecharts-pro-context-menu" style={{ left: `${x}px`, top: `${y}px` }}>
      {props.items.map((item) => (
        <div
          class={`klinecharts-pro-context-menu-item${item.danger ? ' danger' : ''}${item.disabled ? ' disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!item.disabled) {
              item.onClick()
              props.onClose()
            }
          }}
        >
          <Show when={item.icon}>
            <span class="klinecharts-pro-context-menu-item-icon">{item.icon}</span>
          </Show>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default ContextMenu
