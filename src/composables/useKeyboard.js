import { onMounted, onUnmounted } from 'vue'
import { KEYBOARD_SHORTCUTS } from '@/constants'

/**
 * 键盘快捷键管理
 * @param {Object} handlers - 快捷键处理函数映射
 */
export function useKeyboard(handlers = {}) {
  const pressedKeys = new Set()

  /**
   * 解析快捷键字符串
   */
  function parseShortcut(shortcut) {
    const parts = shortcut.toLowerCase().split('+')
    return {
      ctrl: parts.includes('ctrl'),
      shift: parts.includes('shift'),
      alt: parts.includes('alt'),
      meta: parts.includes('meta'),
      key: parts.find(p => !['ctrl', 'shift', 'alt', 'meta'].includes(p))
    }
  }

  /**
   * 检查快捷键是否匹配
   */
  function isShortcutMatch(event, shortcut) {
    const parsed = parseShortcut(shortcut)
    return (
      event.ctrlKey === parsed.ctrl &&
      event.shiftKey === parsed.shift &&
      event.altKey === parsed.alt &&
      event.metaKey === parsed.meta &&
      event.key.toLowerCase() === parsed.key?.toLowerCase()
    )
  }

  /**
   * 处理键盘按下事件
   */
  function handleKeyDown(event) {
    // 忽略在输入框中的快捷键
    const target = event.target
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // 只允许 Esc 在输入框中生效
      if (event.key === 'Escape' && handlers[KEYBOARD_SHORTCUTS.CLOSE]) {
        handlers[KEYBOARD_SHORTCUTS.CLOSE](event)
      }
      return
    }

    // 检查所有注册的快捷键
    for (const [name, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
      if (isShortcutMatch(event, shortcut)) {
        event.preventDefault()
        const handlerName = name.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        if (handlers[handlerName]) {
          handlers[handlerName](event)
        }
        return
      }
    }
  }

  /**
   * 注册快捷键
   */
  function registerShortcut(name, shortcut, handler) {
    KEYBOARD_SHORTCUTS[name.toUpperCase()] = shortcut
    handlers[name] = handler
  }

  /**
   * 移除快捷键
   */
  function unregisterShortcut(name) {
    delete KEYBOARD_SHORTCUTS[name.toUpperCase()]
    delete handlers[name]
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    registerShortcut,
    unregisterShortcut,
    parseShortcut,
    isShortcutMatch
  }
}
