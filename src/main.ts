import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './assets/terrainTextures.css'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)

// 添加Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 挂载应用
app.mount('#app')
