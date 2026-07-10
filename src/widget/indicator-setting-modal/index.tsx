/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { utils } from 'klinecharts'
import { Component, createSignal } from 'solid-js'
import { Modal, Input } from '../../component'
import t from '../../i18n'
import data from './data'

type IndicatorSettingConfig = {
  paramNameKey: string
  precision?: number
  min?: number
  default?: number
}

export interface IndicatorSettingModalProps {
  locale: string
  params: { indicatorName: string; paneId: string; calcParams: number[] }
  onClose: () => void
  onConfirm: (calcParams: number[]) => void
}

const IndicatorSettingModal: Component<IndicatorSettingModalProps> = (props) => {
  const [calcParams, setCalcParams] = createSignal(utils.clone(props.params.calcParams))

  const getConfig: (name: string) => IndicatorSettingConfig[] = (name: string) => {
    return (data as Record<string, IndicatorSettingConfig[]>)[name] ?? []
  }

  return (
    <Modal
      title={props.params.indicatorName}
      width={360}
      buttons={[
        {
          type: 'confirm',
          children: t('confirm', props.locale),
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
              <span>{t(d.paramNameKey, props.locale)}</span>
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
