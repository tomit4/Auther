<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { delay } from '../utils/utils.ts'
import { validateInputs } from '../utils/schema-validators'

const router = useRouter()
const emailInput: Ref<string> = ref('')
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const loginRoute = import.meta.env.VITE_LOGIN_ROUTE as string

const handleSubmit = async (
    emailInput: string,
    passwordInput: string,
): Promise<void> => {
    try {
        errMessage.value = ''
        resSuccessful.value = ''
        validateInputs(emailInput, passwordInput)
        const data = {
            email: emailInput,
            loginPassword: passwordInput,
        }
        const res = await fetch(loginRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        const jsonRes = await res.json()
        if (!res.ok) {
            errMessage.value = jsonRes.message
                ? jsonRes.message
                : 'Unknown error occurred'
            throw new Error(jsonRes.message)
        } else {
            resSuccessful.value = jsonRes.message
            localStorage.setItem('appname-session-token', jsonRes.sessionToken)
            await delay(1000)
            router.push('/app')
        }
    } catch (err) {
        if (err instanceof Error) errMessage.value = err.message
        console.error(err)
    }
}

onBeforeRouteLeave(() => {
    emailInput.value = ''
    passwordInput.value = ''
    errMessage.value = ''
    resSuccessful.value = ''
})
</script>

<template>
    <div>
        <h1>Login</h1>
        <br />
        <span className="email-form">
            <label className="email-label" for="email">Enter Your Email:</label>
            <input
                type="email"
                id="email"
                className="email-input"
                data-test="email-input"
                size="30"
                minlength="5"
                placeholder="jondoe@example.com"
                v-model="emailInput"
                @keyup.enter="
                    handleSubmit(emailInput as string, passwordInput as string)
                "
                v-focus
                required
            />
            <br />
            <label className="password-label" for="password"
                >Enter Your Password:</label
            >
            <input
                type="password"
                id="password"
                className="password-input"
                data-test="password-input"
                size="30"
                minlength="10"
                placeholder="Password1234!"
                v-model="passwordInput"
                @keyup.enter="
                    handleSubmit(emailInput as string, passwordInput as string)
                "
                required
            />
            <button
                @click="
                    handleSubmit(emailInput as string, passwordInput as string)
                "
                data-test="submit-btn"
                type="submit"
                value="Submit"
                className="submit-btn"
            >
                Submit
            </button>
            <router-link className="forgot-password-link" to="/forgot-password"
                >Forgot My Password</router-link
            >
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
.email-label,
.password-label {
    font-size: 100%;
    font-weight: 500;
}
.email-input,
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
a {
    color: black;
}
</style>
