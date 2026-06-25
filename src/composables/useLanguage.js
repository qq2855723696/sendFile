import { ref, readonly } from 'vue'
import { DEFAULT_LANGUAGE, LANGUAGE_KEY, SUPPORTED_LANGUAGES } from '@/constants'
import zhCN from '@/locales/zh-CN'
import enUS from '@/locales/en-US'

/**
 * 多语言支持管理
 */
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

const currentLanguage = ref(getStoredLanguage())

function getStoredLanguage() {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored
  }
  const systemLang = navigator.language
  if (SUPPORTED_LANGUAGES.includes(systemLang)) {
    return systemLang
  }
  return DEFAULT_LANGUAGE
}

function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    currentLanguage.value = lang
    localStorage.setItem(LANGUAGE_KEY, lang)
    document.documentElement.lang = lang
  }
}

// 翻译函数（非响应式，纯函数）
function translate(lang, key, params = {}) {
  const keys = key.split('.')
  let value = messages[lang]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      value = messages[DEFAULT_LANGUAGE]
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2]
        } else {
          return key
        }
      }
      break
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
    return params[paramKey] !== undefined ? params[paramKey] : `{${paramKey}}`
  })
}

function getCurrentLanguage() {
  return currentLanguage.value
}

function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES.map(lang => ({
    code: lang,
    name: lang === 'zh-CN' ? '简体中文' : 'English'
  }))
}

// 初始化
document.documentElement.lang = currentLanguage.value

// Vue 插件
const i18nPlugin = {
  install(app) {
    const frozenLang = readonly(currentLanguage)
    app.config.globalProperties.$t = (key, params) => translate(currentLanguage.value, key, params)
    app.config.globalProperties.$i18n = {
      currentLanguage: frozenLang,
      setLanguage,
      getSupportedLanguages,
      getCurrentLanguage
    }
    app.provide('i18n', {
      currentLanguage: frozenLang,
      setLanguage,
      t: (key, params) => translate(currentLanguage.value, key, params),
      getSupportedLanguages,
      getCurrentLanguage
    })
  }
}

export { i18nPlugin }

export function useLanguage() {
  // t 是普通函数：在渲染上下文中读取 currentLanguage.value 即可保持响应式，
  // 同时也能在 <script> 中直接调用 t('key')
  const t = (key, params = {}) => translate(currentLanguage.value, key, params)

  return {
    currentLanguage: readonly(currentLanguage),
    setLanguage,
    t,
    getCurrentLanguage,
    getSupportedLanguages
  }
}

export { translate, currentLanguage }
