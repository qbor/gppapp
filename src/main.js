import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth } from './composables/useAuth'
import './style.css'

const app = createApp(App)
app.use(router)

// 启动时恢复登录态（Supabase 会话）并确定数据模式
initAuth().then(() => {
  app.mount('#app')
})
