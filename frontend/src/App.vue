<script setup>
import Nav from './components/Nav.vue'
import Footer from './components/Footer.vue'
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
