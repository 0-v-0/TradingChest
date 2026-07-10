import { Component, For, Show } from 'solid-js'
import t from '../../i18n'

export interface DataWindowRow {
  label: string
  value: string
  color?: string
}

export interface DataWindowProps {
  locale: string
  visible: boolean
  onToggle: () => void
  data: DataWindowRow[]
}

const DataWindow: Component<DataWindowProps> = (props) => {
  return (
    <Show when={props.visible}>
      <div class="klinecharts-pro-data-window">
        <div class="klinecharts-pro-data-window-header">
          <span class="klinecharts-pro-data-window-title">
            {t('data_window', props.locale)}
          </span>
          <span class="klinecharts-pro-data-window-close" onClick={props.onToggle}>
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path d="M10 1a9 9 0 100 18 9 9 0 000-18zm4.3 12.3a.5.5 0 01-.7.7L10 10.7l-3.6 3.3a.5.5 0 01-.7-.7L9.3 10 5.7 6.7a.5.5 0 01.7-.7L10 9.3l3.6-3.3a.5.5 0 01.7.7L10.7 10l3.6 3.3z" />
            </svg>
          </span>
        </div>
        <div class="klinecharts-pro-data-window-body">
          <For each={props.data}>
            {(row) => (
              <div class="klinecharts-pro-data-window-row">
                <span class="klinecharts-pro-data-window-label">{row.label}</span>
                <span
                  class="klinecharts-pro-data-window-value"
                  style={row.color ? { color: row.color } : {}}
                >
                  {row.value}
                </span>
              </div>
            )}
          </For>
          <Show when={props.data.length === 0}>
            <div class="klinecharts-pro-data-window-empty">--</div>
          </Show>
        </div>
      </div>
    </Show>
  )
}

export default DataWindow
