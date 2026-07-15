import { lazy } from 'solid-js'
import ContextMenu from './context-menu'
import DataWindow from './data-window'
import DrawingBar from './drawing-bar'
import OverlayPropertyBar from './overlay-property-bar'
import PeriodBar from './period-bar'
import ReplayControlBar from './replay-bar'

const IndicatorModal = lazy(() => import('./indicator-modal'))
const IndicatorSettingModal = lazy(() => import('./indicator-setting-modal'))
const ScreenshotModal = lazy(() => import('./screenshot-modal'))
const SettingModal = lazy(() => import('./setting-modal'))
const SymbolSearchModal = lazy(() => import('./symbol-search-modal'))
const ThemeEditor = lazy(() => import('./theme-editor'))
const TimezoneModal = lazy(() => import('./timezone-modal'))

// oxfmt-ignore
export {
  ContextMenu, DataWindow, PeriodBar, DrawingBar, IndicatorModal,
  TimezoneModal, SettingModal, ScreenshotModal,
  IndicatorSettingModal, SymbolSearchModal, ThemeEditor,
  OverlayPropertyBar, ReplayControlBar
}
