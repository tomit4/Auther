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
    // TODO: protect if not coming from signup (redirect back to signup if not coming from there)
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
        meta: { is404: true },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})
// TODO: redirect to app if already logged in from anywhere else in page (i.e. signup, etc.)
router.beforeEach(async (to): Promise<string | undefined> => {
    const sessionToken = localStorage.getItem('appname-session-token')
    if (to.meta.requiresAuth && sessionToken) {
        /* NOTE: you can possibly use userAgent string in redis cache or jwt
         * to prevent multiple device login */
        console.log('userAgent :=>', navigator.userAgent)
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
            } else {
                localStorage.removeItem('appname-session-token')
                // TODO: hit route on backend that resets http only refresh token cookie to maxAge=0
                return '/login'
            }
        }
    } else if (!to.meta.is404 && !to.meta.requiresAuth && sessionToken) {
        return '/app'
    } else if (to.meta.requiresAuth && !sessionToken) {
        return '/login'
    }
})

export { router }
