import { utils, type Styles, type DeepPartial } from 'klinecharts'
import { type Component, createSignal } from 'solid-js'
import { Modal, ColorInput } from '../../component'
import { exportTheme, importTheme, themeEditorFields } from '../../theme/editor'
import { deepSet } from '../../core/deepSet'
import t from '../../i18n'

export interface ThemeEditorProps {
  locale: string
  currentStyles: Styles
  onClose: () => void
  onApply: (styles: DeepPartial<Styles>) => void
}

const ThemeEditor: Component<ThemeEditorProps> = (props) => {
  const [localStyles, setLocalStyles] = createSignal<Record<string, unknown>>(
    utils.clone(props.currentStyles) as unknown as Record<string, unknown>
  )

  const handleColorChange = (key: string, color: string) => {
    const next = utils.clone(localStyles()) as Record<string, unknown>
    deepSet(next, key, color)
    setLocalStyles(next)
  }

  const handleExport = () => {
    const json = exportTheme(props.currentStyles)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'theme.json'
    a.click()
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
          setLocalStyles(utils.clone(props.currentStyles) as unknown as Record<string, unknown>)
          props.onApply(styles)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleApply = () => {
    props.onApply(localStyles() as unknown as DeepPartial<Styles>)
  }

  return (
    <Modal
      title={t('theme_editor', props.locale)}
      width={480}
      buttons={[
        { children: t('export', props.locale), onClick: handleExport },
        { children: t('import', props.locale), onClick: handleImport },
        { children: t('confirm', props.locale), onClick: handleApply },
      ]}
      onClose={props.onClose}
    >
      <div class="klinecharts-pro-theme-editor">
        {themeEditorFields.map((field) => {
          const value = utils.formatValue(
            localStyles() as unknown as Styles,
            field.key,
          ) as string | undefined
          return (
            <div class="klinecharts-pro-theme-editor-row">
              <span>{t(field.label, props.locale)}</span>
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
