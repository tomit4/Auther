/* v8 ignore next 13 */
import { createApp } from 'vue'
import { router } from './router/index'
import './style.css'
import App from './App.vue'

const app = createApp(App)
// Custom Directive: v-focus
app.directive('focus', {
    mounted: (el: HTMLElement) => el.focus(),
})
app.use(router)
app.mount('#app')
