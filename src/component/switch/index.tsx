import type { Component, JSX } from 'solid-js'

export interface SwitchProps {
  class?: string
  style?: JSX.CSSProperties | string
  open: boolean
  onChange: () => void
}

const Switch: Component<SwitchProps> = (props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      props.onChange?.()
    }
  }
  return (
    <div
      style={props.style}
      class={`klinecharts-pro-switch ${props.open ? 'turn-on' : 'turn-off'} ${props.class ?? ''}`}
      role="switch"
      aria-checked={props.open}
      tabIndex={0}
      onClick={() => props.onChange?.()}
      onKeyDown={handleKeyDown}
    >
      <i class="thumb" />
    </div>
  )
}

export default Switch
