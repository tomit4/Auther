import { createRouter, createWebHistory } from 'vue-router'
const authRoute = import.meta.env.VITE_AUTH_ROUTE
const refreshRoute = import.meta.env.VITE_REFRESH_ROUTE

import AppView from '../views/AppView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import SignUpView from '../views/SignUpView.vue'
import SplashView from '../views/SplashView.vue'
import VerifiedView from '../views/VerifiedView.vue'
import WaitingForActionView from '../views/WaitingForActionView.vue'

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
        path: '/login',
        component: LoginView,
        name: 'LoginView',
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
        meta: { requiresAuth: true },
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

// NOTE: not quite working yet
router.beforeEach(async (to, from, next) => {
    if (to.meta.requiresAuth && localStorage.getItem('appname-session-token')) {
        const sessionToken = localStorage.getItem('appname-session-token')
        const res = await fetch(authRoute, {
            method: 'GET',
            headers: { Authorization: `Bearer ${sessionToken}` },
        })
        if (res.status === 401) {
            const refreshCheck = await fetch(refreshRoute, {
                method: 'GET',
                credentials: 'include',
                headers: { ContentType: 'application/json' },
            })
            if (refreshCheck.status !== 500) {
                const jsonRes = await refreshCheck.json()
                localStorage.setItem(
                    'appname-session-token',
                    jsonRes.sessionToken,
                )
            }
        }
    } else {
        next()
    }
})

export { router }
