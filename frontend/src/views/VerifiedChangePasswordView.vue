<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { delay, grabStoredCookie } from '../utils/utils.ts'
import { validatePasswordInput } from '../utils/schema-validators'
import { logout } from '../utils/auth-utils'

const route = useRoute()
const router = useRouter()
const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const changePasswordRoute = import.meta.env.VITE_CHANGE_PASSWORD_ROUTE

const emailFromCache: Ref<string> = ref('')
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const handleSubmit = async (passwordInput: string): Promise<void> => {
    try {
        errMessage.value = ''
        resSuccessful.value = ''
        validatePasswordInput(passwordInput)
        const data = {
            newPassword: passwordInput,
        }
        const res = await fetch(changePasswordRoute, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        const jsonRes = await res.json()
        if (!res.ok) {
            errMessage.value = jsonRes.message
                ? jsonRes.message
                : 'Unknown error occurred'
            throw Error(jsonRes.message)
        } else {
            resSuccessful.value = jsonRes.message
            await delay(1000)
            localStorage.removeItem('appname-session-token')
            router.push('/app')
        }
    } catch (err) {
        if (err instanceof Error) errMessage.value = err.message
        console.error(err)
    }
}

onMounted(async () => {
    const cookie = grabStoredCookie('appname-hash')
    if (!cookie || cookie !== route.params.hash) {
        errMessage.value =
            'Invalid hash provided, please log back in and try again.'
        logout()
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

onBeforeRouteLeave(() => {
    passwordInput.value = ''
    errMessage.value = ''
    resSuccessful.value = ''
})
</script>

<template>
    <div>
        <h1>App</h1>
        <p data-test="prompt">
            Please enter your New Password for {{ emailFromCache }}
        </p>
        <span className="email-form">
            <label className="password-label" for="password">
                Enter Your Password:
            </label>
            <input
                type="password"
                id="password"
                className="password-input"
                data-test="password-input"
                size="30"
                minlength="10"
                placeholder="Password1234!"
                v-model="passwordInput"
                @keyup.enter="handleSubmit(passwordInput as string)"
                v-focus
                required
            />
            <button
                @click="handleSubmit(passwordInput as string)"
                type="submit"
                value="Submit"
                className="submit-btn"
                data-test="submit-btn"
            >
                Submit
            </button>
        </span>
        <button
            className="btn"
            data-test="go-back-btn"
            @click="router.push('/app')"
        >
            Go Back
        </button>
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
    margin-top: 2.5em;
    font-size: 160%;
}
.password-input {
    display: flex;
    text-align: center;
    font-weight: 700;
    font-size: 80%;
    margin: 1em auto -1em auto;
    border: 2px solid black;
    padding: 0.5em;
    border-radius: 5px;
}
.btn {
    cursor: pointer;
    padding: 0.5em;
    font-weight: 700;
    font-size: 80%;
    border: 2px solid black;
    border-radius: 5px;
    margin: 0.5em auto;
}
.submit-btn {
    display: flex;
    margin: 3em auto 1em auto;
    cursor: pointer;
    padding: 0.5em;
    font-weight: 700;
    font-size: 80%;
    border: 2px solid black;
    border-radius: 5px;
}
</style>
