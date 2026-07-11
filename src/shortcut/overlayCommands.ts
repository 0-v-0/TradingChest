import type { Chart, Overlay } from 'klinecharts'
import type { Command } from './undoRedo'

export class OverlayCreateCommand implements Command {
  constructor(
    private chart: Chart,
    private overlayData: {
      id: string
      name: string
      points: Overlay['points']
      extendData: Overlay['extendData']
      styles: Overlay['styles']
      lock: Overlay['lock']
      visible: Overlay['visible']
    },
  ) {}

  undo(): void {
    this.chart.removeOverlay({ id: this.overlayData.id })
  }

  redo(): void {
    this.chart.createOverlay({
      name: this.overlayData.name,
      id: this.overlayData.id,
      points: this.overlayData.points,
      extendData: this.overlayData.extendData,
      styles: this.overlayData.styles,
      lock: this.overlayData.lock,
    })
  }
}

export class OverlayRemoveCommand implements Command {
  constructor(
    private chart: Chart,
    private overlayData: {
      id: string
      name: string
      points: Overlay['points']
      extendData: Overlay['extendData']
      styles: Overlay['styles']
      lock: Overlay['lock']
      visible: Overlay['visible']
    },
  ) {}

  undo(): void {
    this.chart.createOverlay({
      name: this.overlayData.name,
      id: this.overlayData.id,
      points: this.overlayData.points,
      extendData: this.overlayData.extendData,
      styles: this.overlayData.styles,
      lock: this.overlayData.lock,
    })
  }

  redo(): void {
    this.chart.removeOverlay({ id: this.overlayData.id })
  }
}
