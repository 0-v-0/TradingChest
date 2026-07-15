import { utils } from 'klinecharts'
import { createSignal, createMemo, type Component } from 'solid-js'
import { Modal, Input } from '../../component'
import t from '../../i18n'
import { getIndicatorParams, type IndicatorParamConfig } from './data'

export interface IndicatorSettingModalProps {
  lang: string
  localeKey?: number
  params: { indicatorName: string; paneId: string; calcParams: number[] }
  onClose: () => void
  onConfirm: (calcParams: number[]) => void
}

const IndicatorSettingModal: Component<IndicatorSettingModalProps> = (props) => {
  void props.localeKey
  const [calcParams, setCalcParams] = createSignal(utils.clone(props.params.calcParams))
  const paramsKey = createMemo(() => props.params.calcParams)
  createMemo(() => {
    paramsKey()
    setCalcParams(utils.clone(props.params.calcParams))
  })

  const getConfig: (name: string) => IndicatorParamConfig[] = (name: string) => {
    return getIndicatorParams(name, props.params.calcParams)
  }

  return (
    <Modal
      title={props.params.indicatorName}
      width={360}
      buttons={[
        {
          type: 'confirm',
          children: t('confirm', props.lang),
          onClick: () => {
            const config = getConfig(props.params.indicatorName)
            const params: number[] = []
            utils.clone(calcParams()).forEach((param: number, i: number) => {
              if (!utils.isValid(param)) {
                if ('default' in config[i]) {
                  params.push(config[i]['default'] as number)
                }
              } else {
                params.push(param)
              }
            })
            props.onConfirm(params)
            props.onClose()
          },
        },
      ]}
      onClose={props.onClose}
    >
      <div class="klinecharts-pro-indicator-setting-modal-content">
        {getConfig(props.params.indicatorName).map((d, i) => {
          return (
            <>
              <span>{t(d.paramNameKey, props.lang)}</span>
              <Input
                style={{ width: '200px' }}
                value={calcParams()[i] ?? ''}
                precision={d.precision}
                min={d.min}
                onChange={(value) => {
                  const params = utils.clone(calcParams())
                  params[i] = value as number
                  setCalcParams(params)
                }}
              />
            </>
          )
        })}
      </div>
    </Modal>
  )
}

export default IndicatorSettingModal
