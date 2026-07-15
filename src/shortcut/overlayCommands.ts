import type { Chart } from 'klinecharts'
import type { Command } from './undoRedo'
import type { OverlaySnapshot } from '../types'

export class OverlayCreateCommand implements Command {
  constructor(
    private chart: Chart,
    private overlayData: OverlaySnapshot,
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
      groupId: this.overlayData.groupId,
      visible: this.overlayData.visible,
    })
  }
}

export class OverlayRemoveCommand implements Command {
  constructor(
    private chart: Chart,
    private overlayData: OverlaySnapshot,
  ) {}

  undo(): void {
    this.chart.createOverlay({
      name: this.overlayData.name,
      id: this.overlayData.id,
      points: this.overlayData.points,
      extendData: this.overlayData.extendData,
      styles: this.overlayData.styles,
      lock: this.overlayData.lock,
      groupId: this.overlayData.groupId,
      visible: this.overlayData.visible,
    })
  }

  redo(): void {
    this.chart.removeOverlay({ id: this.overlayData.id })
  }
}
