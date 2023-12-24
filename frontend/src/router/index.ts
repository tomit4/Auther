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
    // TODO: if already logged in (redirect to /app)
    {
        path: '/',
        component: SplashView,
        name: 'SplashView',
    },
    // TODO: if already logged in (redirect to /app)
    {
        path: '/signup',
        component: SignUpView,
        name: 'SignUpView',
    },
    // TODO: if already logged in (redirect to /app)
    {
        path: '/login',
        component: LoginView,
        name: 'LoginView',
    },
    // TODO: protect if not coming from signup (redirect back to signup if not coming from there)
    // TODO: if already logged in (redirect to /app)
    {
        path: '/auth',
        component: WaitingForActionView,
        name: 'WaitingForActionView',
    },
    // TODO: if already logged in (redirect to /app)
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
    // TODO: if already logged in (redirect to /app)
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
// TODO: redirect to app if already logged in from anywhere else in page (i.e. signup, etc.)
router.beforeEach(async to => {
    const sessionToken = localStorage.getItem('appname-session-token')
    if (to.meta.requiresAuth && sessionToken) {
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
    } else if (to.meta.requiresAuth) {
        return '/login'
    }
})

export { router }
