<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { delay } from '../utils/utils.ts'
import { validatePasswordInput } from '../utils/schema-validators'

const route = useRoute()
const router = useRouter()
const forgotPasswordCheckRoute = import.meta.env.VITE_FORGOT_PASS_CHECK_ROUTE
const forgotPasswordChangeRoute = import.meta.env.VITE_FORGOT_PASS_CHANGE_ROUTE

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
            hash: route.params.hash,
        }
        const res = await fetch(forgotPasswordChangeRoute, {
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
            router.push('/login')
        }
    } catch (err) {
        if (err instanceof Error) errMessage.value = err.message
        console.error(err)
    }
}

onMounted(async () => {
    try {
        if (!route.params.hash) throw Error('No hash provided')
        const data = {
            hash: route.params.hash,
        }
        const res = await fetch(forgotPasswordCheckRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        const jsonRes = await res.json()
        if (!res.ok || !jsonRes.ok) {
            errMessage.value =
                res.status === 401
                    ? 'You took too long to answer the forgot password email, please try again'
                    : jsonRes.message
            delay(1000)
            router.push('/forgot-password')
        } else {
            emailFromCache.value = jsonRes.email
        }
    } catch (err) {
        console.error('ERROR :=>', err)
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
        <span className="password-form">
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
