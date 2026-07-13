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

import type { OverlayTemplate } from 'klinecharts'
import { createFibHorizontalLines } from './utils'

const fibonacciSegment: OverlayTemplate = {
  name: 'fibonacciSegment',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay, chart }) => {
    const precision = chart.getSymbol()?.pricePrecision ?? 2
    if (coordinates.length > 1) {
      const percents = [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0]
      const yDif = coordinates[0].y - coordinates[1].y
      const points = overlay.points
      const valueDif = points[0].value! - points[1].value!
      const { lines, texts } = createFibHorizontalLines(
        percents,
        coordinates[0].x,
        coordinates[1].x,
        coordinates[1].y,
        yDif,
        (percent) => `${(points[1].value! + valueDif * percent).toFixed(precision)} (${(percent * 100).toFixed(1)}%)`,
      )
      return [
        { type: 'line', attrs: lines },
        { type: 'text', ignoreEvent: true, attrs: texts },
      ]
    }
    return [
      { type: 'line', attrs: [] },
      { type: 'text', ignoreEvent: true, attrs: [] },
    ]
  },
}

export default fibonacciSegment
