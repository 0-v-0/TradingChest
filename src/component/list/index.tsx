import { Show, type ParentComponent, type ParentProps, type JSX } from 'solid-js'
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
        <Loading />
      </Show>
      <Show when={!props.loading && !props.children && !props.dataSource?.length}>
        <Empty />
      </Show>
      <Show when={props.children}>{props.children}</Show>
      <Show when={!props.children && props.renderItem}>
        {props.dataSource?.map((data) => props.renderItem?.(data))}
      </Show>
      <Show when={!props.children && !props.renderItem}>
        {props.dataSource?.map(() => <li />)}
      </Show>
    </ul>
  )
}

export default List
