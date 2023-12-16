import { createRouter, createWebHistory } from 'vue-router'
import SplashView from '../views/SplashView.vue'
import SignUpView from '../views/SignUpView.vue'
import WaitingForActionView from '../views/WaitingForActionView.vue'
import VerifiedView from '../views/VerifiedView.vue'
import AppView from '../views/AppView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
    {
        path: '/',
        component: SplashView,
        name: 'SplashView',
    },
    {
        path: '/signup',
        component: SignUpView,
        name: 'SignUpView',
    },
    {
        path: '/auth',
        component: WaitingForActionView,
        name: 'WaitingForActionView',
    },
    {
        path: '/verify/:hash',
        component: VerifiedView,
        name: 'VerifiedView',
    },
    // TODO: protect this route with auth/login
    {
        path: '/app',
        component: AppView,
        name: 'AppView',
        // meta: { requiresAuth: true},
    },
    {
        path: '/:catchAll(.*)*',
        component: NotFoundView,
        name: 'NotFoundView',
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export { router }
