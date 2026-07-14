import { utils, type Styles, type DeepPartial } from 'klinecharts'
import { For, createSignal, createMemo, type Component } from 'solid-js'
import { Modal, Select, Switch, ColorInput, type SelectDataSourceItem } from '../../component'
import { getOptions, type SettingOption } from './data'
import { deepSet } from '../../core/deepSet'
import t from '../../i18n'

export interface SettingModalProps {
  lang: string
  localeKey?: number
  currentStyles: Styles
  onClose: () => void
  onChange: (style: DeepPartial<Styles>) => void
  onRestoreDefault: (options: SelectDataSourceItem[]) => void
}

const SettingModal: Component<SettingModalProps> = (props) => {
  void props.localeKey
  const [styles, setStyles] = createSignal(props.currentStyles)
  const groups = createMemo(() => getOptions(props.lang))

  const update = (option: SettingOption, newValue: unknown) => {
    const style = {} as Record<string, unknown>
    deepSet(style, option.key, newValue)
    const ss = utils.clone(styles())
    deepSet(ss as unknown as Record<string, unknown>, option.key, newValue)
    setStyles(ss)
    props.onChange(style)
  }

  const flatOptions = createMemo(() => groups().flatMap((group) => group.options))

  return (
    <Modal
      title={t('setting', props.lang)}
      width={560}
      buttons={[
        {
          children: t('restore_default', props.lang),
          onClick: () => {
            props.onRestoreDefault(flatOptions())
            props.onClose()
          },
        },
      ]}
      onClose={props.onClose}
    >
      <For each={groups()}>
        {(group) => (
          <>
            <div class="klinecharts-pro-setting-modal-group-label">{group.label}</div>
            <div class="klinecharts-pro-setting-modal-content">
              <For each={group.options}>
                {(option) => {
                  let component
                  const value = utils.formatValue(styles(), option.key)
                  switch (option.component) {
                    case 'select': {
                      const selectValue = typeof value === 'string' ? t(value, props.lang) : String(value ?? '')
                      component = (
                        <Select
                          style={{ width: '120px' }}
                          value={selectValue}
                          dataSource={option.dataSource}
                          onSelected={(data) => {
                            const newValue = (data as SelectDataSourceItem).key
                            update(option, newValue)
                          }}
                        />
                      )
                      break
                    }
                    case 'switch': {
                      const open = !!value
                      component = (
                        <Switch
                          open={open}
                          onChange={() => {
                            const newValue = !open
                            update(option, newValue)
                          }}
                        />
                      )
                      break
                    }
                    case 'color': {
                      component = (
                        <ColorInput
                          value={(value as string) ?? '#000000'}
                          onChange={(color) => {
                            update(option, color)
                          }}
                        />
                      )
                      break
                    }
                  }
                  return (
                    <>
                      <span>{option.text}</span>
                      {component}
                    </>
                  )
                }}
              </For>
            </div>
          </>
        )}
      </For>
    </Modal>
  )
}

export default SettingModal
