<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { delay, grabStoredCookie } from '../utils/utils.ts'
const route = useRoute()
const router = useRouter()
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const verifyRoute = import.meta.env.VITE_VERIFY_ROUTE as string

// TODO: wrap in try catch like other views
onMounted(async () => {
    try {
        const cookie = grabStoredCookie('appname-hash')
        if (!route.params.hash) throw Error('No hash provided')
        if (!cookie) throw Error('No cookie hash found')
        if (cookie && cookie === route.params.hash) {
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
            if (!res.ok || jsonRes.error) {
                const errMsg = {
                    ok: res.ok,
                    message: jsonRes.message
                        ? jsonRes.message
                        : 'Unknown error occurred',
                }
                throw new Error(errMsg.message)
            } else {
                resSuccessful.value = jsonRes.message
                localStorage.setItem(
                    'appname-session-token',
                    jsonRes.sessionToken,
                )
                await delay(1000)
                router.push('/app')
            }
        } else
            throw new Error(
                'Invalid hash provided, please try and sign up again.',
            )
    } catch (err) {
        if (err instanceof Error) errMessage.value = err.message
        await delay(1000)
        router.push('/')
    }
})
</script>

<template>
    <div>
        <h1 data-test="h1">Thanks For Answering Our Email,</h1>
        <h2 data-test="h2">please wait while we verify...</h2>
        <span v-if="errMessage?.length">
            <p data-test="err-message">{{ errMessage }}</p>
        </span>
        <span v-else-if="resSuccessful?.length">
            <p data-test="res-successful">{{ resSuccessful }}</p>
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
