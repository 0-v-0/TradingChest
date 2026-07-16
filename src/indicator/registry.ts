import type { Indicator, IndicatorTemplate, KLineData } from 'klinecharts'

type IndicatorLoader = () => Promise<IndicatorTemplate>
type RegisterFn = (template: IndicatorTemplate) => void

export class IndicatorRegistry {
  #registered = new Set<string>()
  #loaders = new Map<string, IndicatorLoader>()
  #pending = new Map<string, Promise<void>>()
  #registerFn: RegisterFn = () => {}

  setRegisterFn(fn: RegisterFn): void {
    this.#registerFn = fn
  }

  setLoader(name: string, loader: IndicatorLoader): void {
    this.#loaders.set(name, loader)
  }

  setLoaders(loaders: Record<string, IndicatorLoader>): void {
    for (const [name, loader] of Object.entries(loaders)) {
      this.#loaders.set(name, loader)
    }
  }

  isRegistered(name: string): boolean {
    return this.#registered.has(name)
  }

  markRegistered(name: string): void {
    this.#registered.add(name)
  }

  async ensureRegistered(name: string): Promise<void> {
    if (this.#registered.has(name)) return

    if (this.#pending.has(name)) {
      return this.#pending.get(name)!
    }

    const loader = this.#loaders.get(name)
    if (!loader) {
      // No loader registered — assume it was registered externally (e.g. by KLineChart built-ins)
      console.debug(`[TradingChest] No loader for indicator "${name}", assuming pre-registered`)
      this.#registered.add(name)
      return
    }

    const promise = loader().then((template) => {
      this.#registerFn(wrapCalcParamsValidation(template))
      this.#registered.add(name)
    }).finally(() => {
      this.#pending.delete(name)
    })

    this.#pending.set(name, promise)
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
  const frozenTemplate = Object.keys(nanTemplate).length > 0 ? Object.freeze(nanTemplate) : null
  const hasKeys = frozenTemplate !== null
  let cachedNanResult: Record<string, unknown>[] | undefined
  let cachedNanLen = 0
  const wrappedCalc = (dataList: KLineData[], indicator: Indicator) => {
    const params = indicator.calcParams
    if (params.some(p => typeof p === 'number' && p < 1)) {
      const n = dataList.length
      if (hasKeys && cachedNanResult && n === cachedNanLen) return cachedNanResult
      const result: Record<string, unknown>[] = new Array(n)
      if (hasKeys) {
        result.fill(frozenTemplate!)
        cachedNanResult = result
        cachedNanLen = n
      }
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
