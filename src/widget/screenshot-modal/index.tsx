import type { Component } from 'solid-js'
import { Modal } from '../../component'
import t from '../../i18n'

export interface ScreenshotModalProps {
  locale: string
  url: string
  onClose: () => void
}

const ScreenshotModal: Component<ScreenshotModalProps> = (props) => {
  return (
    <Modal
      title={t('screenshot', props.locale)}
      width={540}
      buttons={[
        {
          type: 'confirm',
          children: t('save', props.locale),
          onClick: () => {
            try {
              const a = document.createElement('a')
              a.download = 'screenshot'
              a.href = props.url
              document.body.appendChild(a)
              a.click()
              a.remove()
            } catch {
              console.warn('Screenshot download failed')
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
