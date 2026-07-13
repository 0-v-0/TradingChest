import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { Modal, List, Checkbox, Input } from '../../component'
import t from '../../i18n'
import { indicatorCategories } from '../../indicator'
import {
  addFavoriteIndicator,
  removeFavoriteIndicator,
  isFavoriteIndicator,
} from '../../core/favorites'

type OnIndicatorChange = (params: { name: string; paneId: string; added: boolean }) => void

export interface IndicatorModalProps {
  locale: string
  mainIndicators: string[]
  subIndicators: Record<string, string>
  onMainIndicatorChange: OnIndicatorChange
  onSubIndicatorChange: OnIndicatorChange
  onClose: () => void
}

// oxfmt-ignore
// 主图指标（叠加在蜡烛图上）
// 名称必须与 IndicatorTemplate.name 完全一致
const MAIN_INDICATORS = [
  'MA', 'EMA', 'SMA', 'BOLL', 'SAR', 'BBI',
  'DEMA', 'TEMA', 'WMA', 'HMA', 'KAMA', 'VWMA',
  'ZLEMA', 'MCGINLEY', 'ENVELOPES', 'T3',
  'ICHIMOKU', 'ALLIGATOR', 'LINEARREGRESSION',
  'KC', 'DC', 'PIVOTPOINTS'
]

// oxfmt-ignore
// 副图指标（独立面板）
const SUB_INDICATORS = [
  'MA', 'EMA', 'VOL', 'MACD', 'BOLL', 'KDJ',
  'RSI', 'BIAS', 'BRAR', 'CCI', 'DMI',
  'CR', 'PSY', 'DMA', 'TRIX', 'OBV',
  'VR', 'WR', 'MTM', 'EMV', 'SAR',
  'SMA', 'ROC', 'PVT', 'BBI', 'AO',
  // 新增指标
  'ATR', 'SUPERTREND',
  'HV', 'STDDEV', 'CV', 'MI', 'UI', 'BBW',
  'VWAP', 'MFI', 'CMF', 'AD', 'VROC', 'KVO', 'FI', 'ELDER_RAY',
  'StochRSI', 'ADX', 'AROON', 'UO', 'FISHER',
  'COPPOCK', 'PPO', 'DPO', 'KST', 'TMF',
  'ZIGZAG'
]

// 分类 Tab 列表
const CATEGORY_KEYS = ['all', 'favorites', 'trend', 'volatility', 'volume', 'momentum', 'other'] as const

const IndicatorModal: Component<IndicatorModalProps> = (props) => {
  const [searchText, setSearchText] = createSignal('')
  const [activeCategory, setActiveCategory] = createSignal<string>('all')
  const [favVersion, setFavVersion] = createSignal(0)

  const searchIcon = (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="17" y2="17" />
    </svg>
  )
  const clearIcon = (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
      <path d="M10 1a9 9 0 100 18 9 9 0 000-18zm4.3 12.3a.5.5 0 01-.7.7L10 10.7l-3.6 3.3a.5.5 0 01-.7-.7L9.3 10 5.7 6.7a.5.5 0 01.7-.7L10 9.3l3.6-3.3a.5.5 0 01.7.7L10.7 10l3.6 3.3z" />
    </svg>
  )

  // 根据分类和搜索筛选指标
  const filterIndicatorNames = (source: readonly string[]) => {
    favVersion()
    const search = searchText().toLowerCase()
    const cat = activeCategory()
    return source.filter((name) => {
      if (
        search &&
        !name.toLowerCase().includes(search) &&
        !t(name.toLowerCase(), props.locale).toLowerCase().includes(search)
      ) {
        return false
      }
      if (cat === 'all') return true
      if (cat === 'favorites') return isFavoriteIndicator(name)
      const category = indicatorCategories[cat]
      return category?.names.includes(name) ?? false
    })
  }

  const filteredMainIndicators = createMemo(() => filterIndicatorNames(MAIN_INDICATORS))
  const filteredSubIndicators = createMemo(() => filterIndicatorNames(SUB_INDICATORS))

  const getCategoryLabel = (key: string): string => {
    if (key === 'all') return t('all_categories', props.locale)
    if (key === 'favorites') return t('indicator_favorites', props.locale)
    const cat = indicatorCategories[key]
    return cat ? t(cat.labelKey, props.locale) : key
  }

  const toggleFavorite = (name: string, e: MouseEvent) => {
    e.stopPropagation()
    if (isFavoriteIndicator(name)) {
      removeFavoriteIndicator(name)
    } else {
      addFavoriteIndicator(name)
    }
    setFavVersion((v) => v + 1)
  }

  const StarIcon = ({ name }: { name: string }) => {
    favVersion()
    const fav = isFavoriteIndicator(name)
    return (
      <span
        class="klinecharts-pro-indicator-modal-star"
        onClick={(e) => toggleFavorite(name, e)}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.5">
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8z" />
        </svg>
      </span>
    )
  }

  return (
    <Modal title={t('indicator', props.locale)} width={480} onClose={props.onClose}>
      {/* 搜索栏 */}
      <div class="klinecharts-pro-indicator-modal-search">
        <Input
          prefix={searchIcon}
          suffix={
            <Show when={searchText().length > 0}>
              <span
                style={{ cursor: 'pointer', display: 'flex' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSearchText('')
                }}
              >
                {clearIcon}
              </span>
            </Show>
          }
          placeholder={t('indicator_search', props.locale)}
          value={searchText()}
          onChange={(v) => setSearchText(v as string)}
        />
      </div>
      {/* 分类 Tab */}
      <div class="klinecharts-pro-indicator-modal-tabs">
        <For each={[...CATEGORY_KEYS]}>
          {(key) => (
            <span
              class={`klinecharts-pro-indicator-modal-tab${activeCategory() === key ? ' active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {getCategoryLabel(key)}
            </span>
          )}
        </For>
      </div>
      <List class="klinecharts-pro-indicator-modal-list">
        <Show when={filteredMainIndicators().length > 0}>
          <li class="title">{t('main_indicator', props.locale)}</li>
        </Show>
        <For each={filteredMainIndicators()}>
          {(name) => {
            const checked = createMemo(() => props.mainIndicators.includes(name))
            return (
              <li
                class="row"
                onClick={() => {
                  props.onMainIndicatorChange({ name, paneId: 'candle_pane', added: !checked() })
                }}
              >
                <Checkbox checked={checked()} label={t(name.toLowerCase(), props.locale) || name} />
                <StarIcon name={name} />
              </li>
            )
          }}
        </For>
        <Show when={filteredSubIndicators().length > 0}>
          <li class="title">{t('sub_indicator', props.locale)}</li>
        </Show>
        <For each={filteredSubIndicators()}>
          {(name) => {
            const checked = createMemo(() => name in props.subIndicators)
            return (
              <li
                class="row"
                onClick={() => {
                  props.onSubIndicatorChange({
                    name,
                    paneId: props.subIndicators[name] ?? '',
                    added: !checked(),
                  })
                }}
              >
                <Checkbox checked={checked()} label={t(name.toLowerCase(), props.locale) || name} />
                <StarIcon name={name} />
              </li>
            )
          }}
        </For>
        <Show when={filteredMainIndicators().length === 0 && filteredSubIndicators().length === 0}>
          <li class="klinecharts-pro-indicator-modal-empty">
            {t('no_indicators_found', props.locale)}
          </li>
        </Show>
      </List>
    </Modal>
  )
}

export default IndicatorModal
