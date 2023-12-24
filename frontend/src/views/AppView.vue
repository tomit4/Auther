<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const authRoute = import.meta.env.VITE_AUTH_ROUTE
const refreshRoute = import.meta.env.VITE_REFRESH_ROUTE

onMounted(async () => {
    const sessionToken = localStorage.getItem('appname-session-token')
    try {
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
            if (refreshCheck.status === 500) {
                router.push('/login')
            } else {
                const jsonRes = await refreshCheck.json()
                localStorage.setItem(
                    'appname-session-token',
                    jsonRes.sessionToken,
                )
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            console.error('ERROR :=>', err)
        }
    }
})
</script>

<template>
    <!-- TODO: protect this route with auth/login via vue-router as well -->
    <div>
        <h1>Welcome To My App!</h1>
        <h2>here you should be signed up and logged in!</h2>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 2.5em;
    font-size: 160%;
}
h2 {
    font-size: 120%;
}
</style>
