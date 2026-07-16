import { utils, type Styles, type DeepPartial } from 'klinecharts'
import { type Component, createSignal } from 'solid-js'
import { Modal, ColorInput } from '../../component'
import { exportTheme, importTheme, themeEditorFields } from '../../theme/editor'
import { deepSet } from '../../core/deepSet'
import { downloadUrl } from '../../core/download'
import t from '../../i18n'

export interface ThemeEditorProps {
  lang: string
  localeKey?: number
  currentStyles: Styles
  onClose: () => void
  onApply: (styles: DeepPartial<Styles>) => void
}

const ThemeEditor: Component<ThemeEditorProps> = (props) => {
  void props.localeKey
  const [localStyles, setLocalStyles] = createSignal<object>(
    utils.clone(props.currentStyles)
  )

  const handleColorChange = (key: string, color: string) => {
    const next = { ...localStyles() } as object
    deepSet(next, key, color)
    setLocalStyles(next)
  }

  const handleExport = () => {
    const json = exportTheme(props.currentStyles)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    downloadUrl(url, 'theme.json')
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const styles = importTheme(reader.result as string)
        if (styles) {
          setLocalStyles(utils.clone(props.currentStyles))
          props.onApply(styles)
        }
      }
      reader.onerror = () => {
        console.warn('[TradingChest] Theme import: failed to read file')
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleApply = () => {
    props.onApply(localStyles() as DeepPartial<Styles>)
  }

  return (
    <Modal
      title={t('theme_editor', props.lang)}
      width={480}
      buttons={[
        { children: t('export', props.lang), onClick: handleExport },
        { children: t('import', props.lang), onClick: handleImport },
        { children: t('confirm', props.lang), onClick: handleApply },
      ]}
      onClose={props.onClose}
    >
      <div class="klinecharts-pro-theme-editor">
        {themeEditorFields.map((field) => {
          const value = utils.formatValue(
            localStyles() as Styles,
            field.key,
          ) as string | undefined
          return (
            <div class="klinecharts-pro-theme-editor-row">
              <span>{t(field.label, props.lang)}</span>
              <ColorInput
                value={value ?? '#000000'}
                onChange={(color) => handleColorChange(field.key, color)}
              />
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default ThemeEditor
