<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()

const grabStoredCookie = (cookieKey: string): string => {
    const cookies = document.cookie.split('; ').reduce((prev, current) => {
        const [key, ...value] = current.split('=')
        prev[key] = value.join('=')
        return prev
    }, {})
    const cookieVal = cookieKey in cookies ? cookies[`${cookieKey}`] : undefined
    return cookieVal
}

const cookie = grabStoredCookie('appname-hash')
console.log('hash in route:=>', route.params.hash)
if (cookie === route.params.hash) {
    console.log('verified!')
} else {
    console.log('not verified!')
}
</script>

<template>
    <div>
        <h1>Thanks For Answering Our Email,</h1>
        <h2>please wait while we verify...</h2>
    </div>
</template>

<style scoped>
h1 {
    font-size: 160%;
}
</style>
