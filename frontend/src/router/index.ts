import { createRouter, createWebHistory } from 'vue-router'
const authRoute = import.meta.env.VITE_AUTH_ROUTE
const refreshRoute = import.meta.env.VITE_REFRESH_ROUTE
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const invalidTokenCode = import.meta.env.VITE_INVALID_TOKEN_CODE

import AppView from '../views/AppView.vue'
import LoginView from '../views/LoginView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import SignUpView from '../views/SignUpView.vue'
import SplashView from '../views/SplashView.vue'
import VerifiedView from '../views/VerifiedView.vue'
import VerifiedChangePasswordView from '../views/VerifiedChangePasswordView.vue'
import VerifiedForgotPasswordView from '../views/VerifiedForgotPasswordView.vue'
import VerifiedDeleteProfileView from '../views/VerifiedDeleteProfileView.vue'
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
        path: '/forgot-password',
        component: ForgotPasswordView,
        name: 'ForgotPasswordView',
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
    {
        path: '/verify-change-pass/:hash',
        component: VerifiedChangePasswordView,
        name: 'VerifiedChangePasswordView',
        meta: { requiresAuth: true },
    },
    {
        path: '/verify-forgot-pass/:hash',
        component: VerifiedForgotPasswordView,
        name: 'VerifiedForgotPasswordView',
        meta: { requiresEmailVerification: true },
    },
    {
        path: '/verify-delete-profile/:hash',
        component: VerifiedDeleteProfileView,
        name: 'VerifiedDeleteProfileView',
        meta: { requiresAuth: true },
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

const authorizeSession = async (sessionToken: string): Promise<Response> => {
    return await fetch(authRoute, {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionToken}` },
    })
}

const attemptRefresh = async (): Promise<
    Response & { statusCode?: number; sessionToken?: string; code?: number }
> => {
    const refreshCheck = await fetch(refreshRoute, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    })
    return refreshCheck.json()
}

const attemptLogout = async (): Promise<Response & { code?: number }> => {
    const logOutRes = await fetch(logoutRoute, {
        method: 'GET',
        credentials: 'include',
    })
    return logOutRes.json()
}

// TODO: Heavy refactor into smaller helper functions
router.beforeEach(async (to, from): Promise<string | undefined> => {
    const sessionToken = localStorage.getItem('appname-session-token')
    try {
        if (to.meta.requiresAuth && sessionToken) {
            const res = await authorizeSession(sessionToken)
            if (!res.ok) {
                const jsonRes = await attemptRefresh()
                if (jsonRes.ok) {
                    localStorage.setItem(
                        'appname-session-token',
                        jsonRes.sessionToken as string,
                    )
                } else {
                    const logOutRes = await attemptLogout()
                    if (!logOutRes.ok && logOutRes.code !== invalidTokenCode)
                        console.error('ERROR while logging out :=>', logOutRes)
                    localStorage.removeItem('appname-session-token')
                    return '/login'
                }
            }
        } else if (!to.meta.is404 && !to.meta.requiresAuth && sessionToken) {
            return '/app'
        } else if (to.meta.requiresAuth && !sessionToken) {
            const logOutRes = await attemptLogout()
            if (!logOutRes.ok)
                console.error('ERROR while logging out :=>', logOutRes)
            return '/login'
        } else if (
            !to.meta.requiresAuth &&
            to.path === '/auth' &&
            from.path !== '/signup'
        ) {
            return '/'
        }
    } catch (err) {
        console.error('ERROR :=>', err)
    }
})

export { router }
