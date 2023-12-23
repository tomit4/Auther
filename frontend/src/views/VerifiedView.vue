<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const verifyRoute = import.meta.env.VITE_VERIFY_ROUTE

// TODO: place in utility class/file
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const grabStoredCookie = (cookieKey: string): string => {
    const cookies = document.cookie.split('; ').reduce((prev, current) => {
        const [key, ...value] = current.split('=')
        // TODO: consider refactoring this using a Map
        prev[key] = value.join('=')
        return prev
    }, {})
    const cookieVal = cookieKey in cookies ? cookies[cookieKey] : undefined
    return cookieVal
}

onMounted(async () => {
    const cookie = grabStoredCookie('appname-hash')
    if (cookie === route.params.hash) {
        const data = {
            hashedEmail: cookie,
        }
        const res = await fetch(verifyRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        const jsonRes = await res.json()
        // TODO: grab the jwt from the return body and set it in local storage
        if (!res.ok || jsonRes.error) {
            const errMsg = {
                ok: res.ok,
                error: jsonRes.error ? jsonRes.error : 'Unknown error occurred',
            }
            errMessage.value = errMsg.error
            // TODO: set up watcher to display count down before redirect
            await delay(1000)
            router.push('/')
        } else {
            resSuccessful.value = jsonRes.msg
            localStorage.setItem('appname-token', jsonRes.token)
            // TODO: grab a JWT from backend for
            // further authentication in /app route
            // TODO: set up watcher to display count down before redirect
            await delay(1000)
            router.push('/app')
        }
    } else {
        // TODO: set refs to display error message before redirect
        errMessage.value =
            'Invalid hash provided, please try and sign up again.'
        await delay(1000)
        router.push('/signup')
    }
})
</script>

<template>
    <div>
        <h1>Thanks For Answering Our Email,</h1>
        <h2>please wait while we verify...</h2>
        <span v-if="errMessage">
            <p>{{ errMessage }}</p>
        </span>
        <span v-else-if="resSuccessful.length">
            <p>{{ resSuccessful }}</p>
        </span>
        <span v-else />
    </div>
</template>

<style scoped>
h1 {
    font-size: 160%;
}
h2 {
    font-size: 120%;
}
</style>
