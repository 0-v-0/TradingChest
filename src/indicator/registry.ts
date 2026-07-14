import type { Indicator, IndicatorTemplate, KLineData } from 'klinecharts'

type IndicatorLoader = () => Promise<IndicatorTemplate>
type RegisterFn = (template: IndicatorTemplate) => void

export class IndicatorRegistry {
  private _registered = new Set<string>()
  private _loaders = new Map<string, IndicatorLoader>()
  private _pending = new Map<string, Promise<void>>()
  private _registerFn: RegisterFn = () => {}

  setRegisterFn(fn: RegisterFn): void {
    this._registerFn = fn
  }

  setLoader(name: string, loader: IndicatorLoader): void {
    this._loaders.set(name, loader)
  }

  setLoaders(loaders: Record<string, IndicatorLoader>): void {
    for (const [name, loader] of Object.entries(loaders)) {
      this._loaders.set(name, loader)
    }
  }

  isRegistered(name: string): boolean {
    return this._registered.has(name)
  }

  markRegistered(name: string): void {
    this._registered.add(name)
  }

  async ensureRegistered(name: string): Promise<void> {
    if (this._registered.has(name)) return

    if (this._pending.has(name)) {
      return this._pending.get(name)!
    }

    const loader = this._loaders.get(name)
    if (!loader) {
      // No loader registered — assume it was registered externally (e.g. by KLineChart built-ins)
      console.debug(`[TradingChest] No loader for indicator "${name}", assuming pre-registered`)
      this._registered.add(name)
      return
    }

    const promise = loader().then((template) => {
      this._registerFn(wrapCalcParamsValidation(template))
      this._registered.add(name)
    }).finally(() => {
      this._pending.delete(name)
    })

    this._pending.set(name, promise)
    return promise
  }
}

/**
 * 统一 calcParams 校验包装器。
 * 当任何数值参数 < 1 时，跳过真实 calc 调用，直接返回 NaN 填充的结果数组。
 * 通过 figures 键名构造默认 NaN 对象，避免下游渲染因缺失 key 而出错。
 */
function wrapCalcParamsValidation(template: IndicatorTemplate): IndicatorTemplate {
  const originalCalc = template.calc
  if (typeof originalCalc !== 'function') return template

  const figures = Array.isArray(template.figures) ? template.figures : []
  const nanTemplate = createNaNTemplate(figures)
  const hasKeys = Object.keys(nanTemplate).length > 0
  const frozenTemplate = hasKeys ? Object.freeze(nanTemplate) : null
  const wrappedCalc = (dataList: KLineData[], indicator: Indicator) => {
    const params = indicator.calcParams
    if (params.some(p => typeof p === 'number' && p < 1)) {
      const n = dataList.length
      const result: Record<string, unknown>[] = new Array(n)
      result.fill(frozenTemplate ?? {})
      return result
    }
    return originalCalc(dataList, indicator)
  }
  return { ...template, calc: wrappedCalc }
}

function createNaNTemplate(figures: Array<{ key: string }>): Record<string, number> {
  const tmpl: Record<string, number> = {}
  for (const f of figures) tmpl[f.key] = NaN
  return tmpl
}
