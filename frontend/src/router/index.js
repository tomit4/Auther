import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import OnboardingView from '../views/OnboardingView.vue'

const routes = [
    {
        path: '/',
        component: HomeView,
        name: 'HomeView',
        // meta: { requiresAuth: true, requiresCompleteProfile: true },
    },
    {
        path: '/onboarding',
        component: OnboardingView,
        name: 'OnboardingView',
        // meta: { requiresAuth: true, requiresCompleteProfile: false },
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export { router }
