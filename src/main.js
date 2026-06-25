import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './style.css'
import { i18nPlugin } from '@/composables/useLanguage'

const app = createApp(App)
app.use(ElementPlus)
app.use(i18nPlugin)
app.mount('#app')
