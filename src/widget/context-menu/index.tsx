import { Show, For, onCleanup, onMount, type Component } from 'solid-js'

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

const MENU_WIDTH = 160

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

  let menuRef: HTMLDivElement | undefined

  // Clamp position after mount using actual rendered height
  const clampedStyle = () => {
    const x = Math.min(props.x, window.innerWidth - MENU_WIDTH - 8)
    const y = Math.min(props.y, window.innerHeight - (menuRef?.offsetHeight ?? props.items.length * 32 + 8) - 8)
    return { left: `${x}px`, top: `${y}px` }
  }

  return (
    <div ref={(el) => { menuRef = el }} class="klinecharts-pro-context-menu" style={clampedStyle()}>
      <For each={props.items}>{(item) => (
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
      )}</For>
    </div>
  )
}

export default ContextMenu
