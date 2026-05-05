import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import IconRender from './components/IconRender.vue'

const app = createApp(App)
app.component('IconRender', IconRender)
app.mount('#app')
