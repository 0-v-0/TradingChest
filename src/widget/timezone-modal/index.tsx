import { createSignal, createMemo, type Component } from 'solid-js'
import { Modal, Select, type SelectDataSourceItem } from '../../component'
import t from '../../i18n'
import { createTimezoneSelectOptions } from './data'

export interface TimezoneModalProps {
  locale: string
  timezone: SelectDataSourceItem
  onClose: () => void
  onConfirm: (timezone: SelectDataSourceItem) => void
}

const TimezoneModal: Component<TimezoneModalProps> = (props) => {
  const [innerTimezone, setInnerTimezone] = createSignal(props.timezone)

  const timezoneOptions = createMemo(() => createTimezoneSelectOptions(props.locale))

  return (
    <Modal
      title={t('timezone', props.locale)}
      width={320}
      buttons={[
        {
          children: t('confirm', props.locale),
          onClick: () => {
            props.onConfirm(innerTimezone())
            props.onClose()
          },
        },
      ]}
      onClose={props.onClose}
    >
      <Select
        style={{ width: '100%', 'margin-top': '20px' }}
        value={innerTimezone().text}
        onSelected={(tz) => {
          setInnerTimezone(tz as SelectDataSourceItem)
        }}
        dataSource={timezoneOptions()}
      />
    </Modal>
  )
}

export default TimezoneModal
