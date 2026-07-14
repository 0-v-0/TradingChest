import type { OverlayCreate, OverlayMode } from 'klinecharts'
import { createMemo, createSignal, Show, For, onCleanup, onMount, type Component } from 'solid-js'
import { List } from '../../component'
import {
  createSingleLineOptions,
  createMoreLineOptions,
  createPolygonOptions,
  createFibonacciOptions,
  createWaveOptions,
  createMeasurementOptions,
  createChannelOptions,
  createAnnotationOptions,
  createPositionOptions,
  createMagnetOptions,
  Icon,
} from './icons'
import {
  getFavoriteTools,
  addFavoriteTool,
  removeFavoriteTool,
  isFavoriteTool,
} from '../../core/favorites'

export interface DrawingBarProps {
  lang: string
  localeKey?: number
  onDrawingItemClick: (overlay: OverlayCreate) => void
  onModeChange: (mode: string) => void
  onLockChange: (lock: boolean) => void
  onVisibleChange: (visible: boolean) => void
  onRemoveClick: (groupId: string) => void
}

const GROUP_ID = 'drawing_tools'

type GroupKey = 'singleLine' | 'moreLine' | 'polygon' | 'fibonacci' | 'wave' | 'measurement' | 'channel' | 'annotation' | 'position'

const INIT_ICON_MAP: Record<GroupKey, string> = {
  singleLine: 'horizontalStraightLine',
  moreLine: 'priceChannelLine',
  polygon: 'circle',
  fibonacci: 'fibonacciLine',
  wave: 'xabcd',
  measurement: 'dateAndPriceRange',
  channel: 'pitchfork',
  annotation: 'textAnnotation',
  position: 'longPosition',
}

const DrawingBar: Component<DrawingBarProps> = (props) => {
  void props.localeKey
  const [iconMap, setIconMap] = createSignal<Record<GroupKey, string>>({ ...INIT_ICON_MAP })
  const setIcon = (key: GroupKey) => (v: string) => setIconMap({ ...iconMap(), [key]: v })

  const [modeIcon, setModeIcon] = createSignal('weak_magnet')
  const [mode, setMode] = createSignal('normal')

  const [lock, setLock] = createSignal(false)

  const [visible, setVisible] = createSignal(true)

  const [popoverKey, setPopoverKey] = createSignal('')
  const [favVersion, setFavVersion] = createSignal(0)

  const favoriteTools = createMemo(() => {
    favVersion()
    return getFavoriteTools()
  })

  const optionLists = createMemo(() => ({
    singleLine: createSingleLineOptions(props.lang),
    moreLine: createMoreLineOptions(props.lang),
    polygon: createPolygonOptions(props.lang),
    fibonacci: createFibonacciOptions(props.lang),
    wave: createWaveOptions(props.lang),
    measurement: createMeasurementOptions(props.lang),
    channel: createChannelOptions(props.lang),
    annotation: createAnnotationOptions(props.lang),
    position: createPositionOptions(props.lang),
  }))

  const overlays = createMemo(() => {
    const lists = optionLists()
    const icons = iconMap()
    return (Object.keys(INIT_ICON_MAP) as GroupKey[]).map((key) => ({
      key,
      icon: icons[key],
      list: lists[key],
      setter: setIcon(key),
    }))
  })

  const modes = createMemo(() => createMagnetOptions(props.lang))

  let barRef!: HTMLDivElement
  onMount(() => {
    const handleOutside = (e: PointerEvent) => {
      if (popoverKey() && !barRef?.contains(e.target as Node)) {
        setPopoverKey('')
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    onCleanup(() => document.removeEventListener('pointerdown', handleOutside))
  })

  return (
    <div ref={barRef} class="klinecharts-pro-drawing-bar">
      <Show when={favoriteTools().length > 0}>
        <div class="favorites-group">
          <For each={favoriteTools()}>{(toolName) => (
            <div
              class="item"
              title={toolName}
              onContextMenu={(e) => {
                e.preventDefault()
                removeFavoriteTool(toolName)
                setFavVersion((v) => v + 1)
              }}
            >
              <span
                style="width:32px;height:32px"
                onClick={() => {
                  props.onDrawingItemClick({
                    groupId: GROUP_ID,
                    name: toolName,
                    visible: visible(),
                    lock: lock(),
                    mode: mode() as OverlayMode,
                  })
                }}
              >
                <Icon name={toolName} />
              </span>
            </div>
          )}</For>
        </div>
        <span class="split-line" />
      </Show>
      <For each={overlays()}>{(item) => {
        const currentLabel = () => String(item.list.find((d) => d.key === item.icon)?.text ?? '')
        return (
          <div
            class="item tool-item"
            title={currentLabel()}
            tabIndex={0}
            onBlur={() => {
              setPopoverKey('')
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              favVersion()
              if (isFavoriteTool(item.icon)) {
                removeFavoriteTool(item.icon)
              } else {
                addFavoriteTool(item.icon)
              }
              setFavVersion((v) => v + 1)
            }}
          >
            <span
              style="width:32px;height:32px"
              onClick={() => {
                props.onDrawingItemClick({
                  groupId: GROUP_ID,
                  name: item.icon,
                  visible: visible(),
                  lock: lock(),
                  mode: mode() as OverlayMode,
                })
              }}
            >
              <Icon name={item.icon} />
            </span>
            <div
              class="icon-arrow"
              onClick={() => {
                if (item.key === popoverKey()) {
                  setPopoverKey('')
                } else {
                  setPopoverKey(item.key)
                }
              }}
            >
              <svg class={item.key === popoverKey() ? 'rotate' : ''} viewBox="0 0 4 6">
                <path
                  d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
                  stroke="none"
                  stroke-opacity="0"
                />
              </svg>
            </div>
            {item.key === popoverKey() && (
              <List class="list">
                {item.list.map((data) => (
                  <li
                    onClick={() => {
                      item.setter(data.key)
                      props.onDrawingItemClick({
                        name: data.key,
                        lock: lock(),
                        mode: mode() as OverlayMode,
                      })
                      setPopoverKey('')
                    }}
                  >
                    <Icon name={data.key} />
                    <span style="padding-left:8px">{data.text}</span>
                  </li>
                ))}
              </List>
            )}
          </div>
        )
      }}</For>
      <span class="split-line" />
      <div
        class="item mode"
        tabIndex={0}
        onBlur={() => {
          setPopoverKey('')
        }}
      >
        <span
          style="width:32px;height:32px"
          onClick={() => {
            let currentMode = modeIcon()
            if (mode() !== 'normal') {
              currentMode = 'normal'
            }
            setMode(currentMode)
            props.onModeChange(currentMode)
          }}
        >
          {modeIcon() === 'weak_magnet' ? (
            mode() === 'weak_magnet' ? (
              <Icon name="weak_magnet" class="selected" />
            ) : (
              <Icon name="weak_magnet" />
            )
          ) : mode() === 'strong_magnet' ? (
            <Icon name="strong_magnet" class="selected" />
          ) : (
            <Icon name="strong_magnet" />
          )}
        </span>
        <div
          class="icon-arrow"
          onClick={() => {
            if (popoverKey() === 'mode') {
              setPopoverKey('')
            } else {
              setPopoverKey('mode')
            }
          }}
        >
          <svg class={popoverKey() === 'mode' ? 'rotate' : ''} viewBox="0 0 4 6">
            <path
              d="M1.07298,0.159458C0.827521,-0.0531526,0.429553,-0.0531526,0.184094,0.159458C-0.0613648,0.372068,-0.0613648,0.716778,0.184094,0.929388L2.61275,3.03303L0.260362,5.07061C0.0149035,5.28322,0.0149035,5.62793,0.260362,5.84054C0.505822,6.05315,0.903789,6.05315,1.14925,5.84054L3.81591,3.53075C4.01812,3.3556,4.05374,3.0908,3.92279,2.88406C3.93219,2.73496,3.87113,2.58315,3.73964,2.46925L1.07298,0.159458Z"
              stroke="none"
              stroke-opacity="0"
            />
          </svg>
        </div>
        {popoverKey() === 'mode' && (
          <List class="list">
            {modes().map((data) => (
              <li
                onClick={() => {
                  setModeIcon(data.key)
                  setMode(data.key)
                  props.onModeChange(data.key)
                  setPopoverKey('')
                }}
              >
                <Icon name={data.key} />
                <span style="padding-left:8px">{data.text}</span>
              </li>
            ))}
          </List>
        )}
      </div>
      <div class="item lock">
        <span
          style="width:32px;height:32px"
          onClick={() => {
            const currentLock = !lock()
            setLock(currentLock)
            props.onLockChange(currentLock)
          }}
        >
          {lock() ? <Icon name="lock" /> : <Icon name="unlock" />}
        </span>
      </div>
      <div class="item visible">
        <span
          style="width:32px;height:32px"
          onClick={() => {
            const v = !visible()
            setVisible(v)
            props.onVisibleChange(v)
          }}
        >
          {visible() ? <Icon name="visible" /> : <Icon name="invisible" />}
        </span>
      </div>
      <span class="split-line" />
      <div class="item remove">
        <span
          style="width:32px;height:32px"
          onClick={() => {
            props.onRemoveClick(GROUP_ID)
          }}
        >
          <Icon name="remove" />
        </span>
      </div>
    </div>
  )
}

export default DrawingBar
