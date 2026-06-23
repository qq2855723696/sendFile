import { ref, watch } from 'vue'
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, SUPPORTED_LANGUAGES } from '@/constants'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'

/**
 * 多语言支持管理
 */
export function useLanguage() {
  const messages = {
    'zh-CN': zhCN,
    'en-US': enUS
  }

  const currentLanguage = ref(getStoredLanguage())

  /**
   * 获取存储的语言设置
   */
  function getStoredLanguage() {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      return stored
    }
    // 自动检测系统语言
    const systemLang = navigator.language
    if (SUPPORTED_LANGUAGES.includes(systemLang)) {
      return systemLang
    }
    return DEFAULT_LANGUAGE
  }

  /**
   * 设置语言
   */
  function setLanguage(lang) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      currentLanguage.value = lang
      localStorage.setItem(LANGUAGE_KEY, lang)
      document.documentElement.lang = lang
    }
  }

  /**
   * 翻译函数
   */
  function t(key, params = {}) {
    const keys = key.split('.')
    let value = messages[currentLanguage.value]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // 回退到默认语言
        value = messages[DEFAULT_LANGUAGE]
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2]
          } else {
            return key // 返回键名作为后备
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // 替换参数
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : `{${paramKey}}`
    })
  }

  /**
   * 获取当前语言
   */
  function getCurrentLanguage() {
    return currentLanguage.value
  }

  /**
   * 获取支持的语言列表
   */
  function getSupportedLanguages() {
    return SUPPORTED_LANGUAGES.map(lang => ({
      code: lang,
      name: lang === 'zh-CN' ? '简体中文' : 'English'
    }))
  }

  // 初始化
  document.documentElement.lang = currentLanguage.value

  return {
    currentLanguage,
    setLanguage,
    t,
    getCurrentLanguage,
    getSupportedLanguages
  }
}
