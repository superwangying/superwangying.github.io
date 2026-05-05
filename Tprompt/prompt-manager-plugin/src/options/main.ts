import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import '@/styles/base.css'
import App from './App.vue'
import ToastNotify from '@/components/ToastNotify.vue'

const app = createApp(App)
app.use(createPinia())
app.component('ToastNotify', ToastNotify)
app.mount('#app')
