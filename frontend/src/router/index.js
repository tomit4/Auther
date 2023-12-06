import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import WaitingForActionView from '../views/WaitingForActionView.vue'
import VerifiedView from '../views/VerifiedView.vue'

const routes = [
    {
        path: '/',
        component: HomeView,
        name: 'HomeView',
        // meta: { requiresAuth: true},
    },
    {
        path: '/onboarding',
        component: OnboardingView,
        name: 'OnboardingView',
        // meta: { requiresAuth: true},
    },
    {
        path: '/auth',
        component: WaitingForActionView,
        name: 'WaitingForActionView',
        // meta: { requiresAuth: true},
    },
    {
        path: '/verified',
        component: VerifiedView,
        name: 'VerifiedView',
        // meta: { requiresAuth: true},
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export { router }
