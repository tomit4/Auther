<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const invalidTokenCode = import.meta.env.VITE_INVALID_TOKEN_CODE

const emailFromCache: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')

// TODO: place in utility class/file
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// TODO: place in utility class/file
const grabStoredCookie = (cookieKey: string): string | undefined => {
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
    if (!cookie || cookie !== route.params.hash) {
        errMessage.value =
            'Invalid hash provided, please log back in and try again.'
        // TODO: Repeated code, put into utility class
        const logOutRes = await fetch(logoutRoute, {
            method: 'GET',
            credentials: 'include',
        })
        const jsonLogOutRes = await logOutRes.json()
        if (
            jsonLogOutRes.statusCode !== 200 &&
            jsonLogOutRes.code !== invalidTokenCode
        ) {
            console.error('ERROR while logging out :=>', jsonLogOutRes)
        }
        localStorage.removeItem('appname-session-token')
        // END repeated code
        await delay(1000)
        router.push('/login')
    }

    const res = await fetch(grabUserIdRoute, {
        method: 'GET',
        credentials: 'include',
    })
    if (res.status === 200) {
        const jsonRes = await res.json()
        emailFromCache.value = jsonRes.email
    } else {
        localStorage.removeItem('appname-session-token')
        router.push('/login')
    }
})
</script>

<template>
    <div>
        <h1>App</h1>
        <p>
            You have successfully deleted profile for {{ emailFromCache }},
            redirecting you back to login...
        </p>
        <span v-if="errMessage">
            <p>{{ errMessage }}</p>
        </span>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 2.5em;
    font-size: 160%;
}
</style>
