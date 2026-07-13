import type { Component } from 'solid-js'

export interface ColorInputProps {
  value: string
  onChange: (color: string) => void
}

const ColorInput: Component<ColorInputProps> = (props) => {
  return (
    <div class="klinecharts-pro-color-input">
      <input
        type="color"
        value={props.value}
        onInput={(e) => props.onChange((e.target as HTMLInputElement).value)}
      />
      <span
        class="klinecharts-pro-color-input-preview"
        style={{ 'background-color': props.value }}
      />
    </div>
  )
}

export default ColorInput
