import defaultBindings from './defaultBindings'
import type { ShortcutBinding } from './defaultBindings'

type ShortcutTarget = HTMLElement | Window

const KEY_ALIAS: Record<string, string> = {
  escape: 'escape',
  delete: 'delete',
  backspace: 'backspace',
  home: 'home',
  end: 'end',
  '+': 'plus',
  '-': 'minus',
  '=': 'plus',
}

const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta'])

/**
 * 快捷键管理器
 * 管理图表的键盘快捷键绑定和执行
 */
export class KeyboardShortcutManager {
  private bindings: ShortcutBinding[]
  private boundElements: WeakMap<ShortcutTarget, (e: KeyboardEvent) => void> = new WeakMap()
  private lookup: Map<string, ShortcutBinding> = new Map()
  private element: ShortcutTarget | null = null
  private actionHandlers: Map<string, () => void> = new Map()
  private enabled: boolean = true

  constructor(customBindings?: ShortcutBinding[]) {
    this.bindings = customBindings ?? [...defaultBindings]
    this._rebuildLookup()
  }

  /**
   * 注册操作处理函数
   */
  registerAction(action: string, handler: () => void): void {
    this.actionHandlers.set(action, handler)
  }

  /**
   * 批量注册操作处理函数
   */
  registerActions(handlers: Record<string, () => void>): void {
    for (const [action, handler] of Object.entries(handlers)) {
      this.actionHandlers.set(action, handler)
    }
  }

  /**
   * 添加自定义快捷键
   */
  addBinding(binding: ShortcutBinding): void {
    this.bindings = this.bindings.filter((b) => b.combo !== binding.combo)
    this.bindings.push(binding)
    this._rebuildLookup()
  }

  /**
   * 移除快捷键
   */
  removeBinding(combo: string): void {
    this.bindings = this.bindings.filter((b) => b.combo !== combo)
    this._rebuildLookup()
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 将键盘事件转换为 combo 字符串
   */
  private eventToCombo(e: KeyboardEvent): string {
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')

    const normalizedKey = KEY_ALIAS[e.key.toLowerCase()] ?? e.key.toLowerCase()

    if (MODIFIER_KEYS.has(normalizedKey)) return ''

    parts.push(normalizedKey)
    return parts.join('+')
  }

  /**
   * 绑定到 DOM 元素
   */
  bindTo(element: ShortcutTarget): void {
    this.unbind()
    const handler = (e: KeyboardEvent) => {
      if (!this.enabled) return

      const target = e.target
      if (target instanceof HTMLElement) {
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
      }

      const combo = this.eventToCombo(e)
      if (!combo) return

      const binding = this.lookup.get(combo)
      if (binding) {
        const handler = this.actionHandlers.get(binding.action)
        if (handler) {
          e.preventDefault()
          e.stopPropagation()
          handler()
        }
      }
    }
    element.addEventListener('keydown', handler as EventListener)
    this.boundElements.set(element, handler)
    this.element = element
  }

  /**
   * 解绑
   */
  unbind(): void {
    if (this.element) {
      const prev = this.boundElements.get(this.element)
      if (prev) {
        this.element.removeEventListener('keydown', prev as EventListener)
        this.boundElements.delete(this.element)
      }
    }
    this.element = null
  }

  /**
   * 获取所有绑定（用于 UI 显示）
   */
  getBindings(): ShortcutBinding[] {
    return [...this.bindings]
  }

  /**
   * 获取事件处理函数（用于外部绑定管理）
   */
  getHandler(): ((e: KeyboardEvent) => void) | null {
    return this.element ? this.boundElements.get(this.element) ?? null : null
  }

  private _rebuildLookup(): void {
    this.lookup.clear()
    for (const b of this.bindings) {
      this.lookup.set(b.combo, b)
    }
  }
}

export { defaultBindings }
export type { ShortcutBinding }
export default KeyboardShortcutManager
