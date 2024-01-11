import { createRouter, createWebHistory } from 'vue-router'
import { authorizeSession, attemptRefresh, logout } from '../utils/auth-utils'

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

router.beforeEach(async (to, from): Promise<string | undefined> => {
    const sessionToken = localStorage.getItem('appname-session-token')
    if (to.meta.requiresAuth && sessionToken) {
        const res = await authorizeSession(sessionToken)
        if (!res.ok) {
            const refreshRes = await attemptRefresh()
            if (refreshRes.ok) {
                localStorage.setItem(
                    'appname-session-token',
                    refreshRes.sessionToken as string,
                )
            } else {
                await logout()
                return '/login'
            }
        }
    } else if (!to.meta.is404 && !to.meta.requiresAuth && sessionToken) {
        return '/app'
    } else if (to.meta.requiresAuth && !sessionToken) {
        await logout()
        return '/login'
    } else if (
        !to.meta.requiresAuth &&
        to.path === '/auth' &&
        from.path !== '/signup'
    ) {
        return '/'
    }
})

export { router }
