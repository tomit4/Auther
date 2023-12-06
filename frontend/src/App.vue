<script setup>
// Components
import Nav from './components/Nav.vue'
import Footer from './components/Footer.vue'
/*
// Vue Dependencies
import { onMounted, onUnmounted, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
// Vue-Router Declarations
const router = useRouter()
// Vue Life-Cycle Hooks
onMounted(() => {
    console.log('Mounted...')
    watchEffect(() => {
        // TODO: change this to conditionally push to onboarding
        // only if user has not received transactional email
        // otherwise redirect to dashboard
        router.push('/onboarding')
    })
})
onUnmounted(() => {
    console.log('Unmounted...')
})
*/
</script>

<template>
    <div className="app">
        <Nav />
        <router-view v-slot="{ Component }">
            <keep-alive>
                <component :is="Component" />
            </keep-alive>
        </router-view>
        <Footer />
    </div>
</template>

<style>
h1 {
    justify-content: center;
    align-items: center;
    margin: 0 auto;
}
.app {
    display: flex;
    margin: 30vh auto 0 auto;
    text-align: center;
    justify-content: center;
    align-items: center;
    width: 80vw;
    max-width: 1920px;
}
</style>
