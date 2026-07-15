import type { Component } from 'solid-js'
import { Modal } from '../../component'
import { downloadUrl } from '../../core/download'
import t from '../../i18n'

export interface ScreenshotModalProps {
  lang: string
  localeKey?: number
  url: string
  onClose: () => void
}

const ScreenshotModal: Component<ScreenshotModalProps> = (props) => {
  void props.localeKey
  return (
    <Modal
      title={t('screenshot', props.lang)}
      width={540}
      buttons={[
        {
          type: 'confirm',
          children: t('save', props.lang),
          onClick: () => {
            try {
              downloadUrl(props.url, 'screenshot')
            } catch {
              console.warn('[TradingChest] Screenshot download failed')
            }
          },
        },
      ]}
      onClose={props.onClose}
    >
      <img style={{ width: '500px', 'margin-top': '20px' }} src={props.url} />
    </Modal>
  )
}

export default ScreenshotModal
