import { useLanguage } from '@/composables/useLanguage'

const { t, currentLanguage, setLanguage, getCurrentLanguage, getSupportedLanguages } = useLanguage()

export { t, currentLanguage, setLanguage, getCurrentLanguage, getSupportedLanguages }
export default { t, currentLanguage, setLanguage, getCurrentLanguage, getSupportedLanguages }
