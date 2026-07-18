import { Show, For, type ParentComponent, type ParentProps, type JSX } from 'solid-js'
import Empty from '../empty'
import Loading from '../loading'

export interface ListProps<T = unknown> extends ParentProps {
  class?: string
  style?: JSX.CSSProperties | string
  loading?: boolean
  dataSource?: T[]
  renderItem?: (data: T) => JSX.Element
}

const List: ParentComponent<ListProps> = (props) => {
  return (
    <ul style={props.style} class={`klinecharts-pro-list ${props.class ?? ''}`} role="list">
      <Show when={props.loading}>
        <li role="status" aria-label="Loading" style={{ display: 'none' }} />
        <Loading />
      </Show>
      <Show when={!props.loading && !props.children && !props.dataSource?.length}>
        <li role="status" aria-label="No data" style={{ display: 'none' }} />
        <Empty />
      </Show>
      <Show when={props.children}>{props.children}</Show>
      <Show when={!props.children && props.renderItem}>
        <For each={props.dataSource}>
          {(data) => props.renderItem?.(data)}
        </For>
      </Show>
    </ul>
  )
}

export default List
