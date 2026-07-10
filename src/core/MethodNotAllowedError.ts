export class MethodNotAllowedError extends Error {
  constructor(methodName: string) {
    super(`[TradingChest] ${methodName} must be called on KLineChartPro instance`)
    this.name = 'MethodNotAllowedError'
  }
}
