<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { delay } from '../utils/utils.ts'
import { validateEmailInput } from '../utils/schema-validators'

const router = useRouter()
const emailInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const forgotPassAskRoute = import.meta.env.VITE_FORGOT_PASS_ASK_ROUTE as string

const handleSubmit = async (emailInput: string): Promise<void> => {
    try {
        errMessage.value = ''
        resSuccessful.value = ''
        validateEmailInput(emailInput)
        const data = {
            email: emailInput,
        }
        const res = await fetch(forgotPassAskRoute, {
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

onBeforeRouteLeave(() => {
    emailInput.value = ''
    errMessage.value = ''
    resSuccessful.value = ''
})
</script>

<template>
    <div>
        <h1>App</h1>
        <p>Forgot Your Password? No Problem.</p>
        <span className="email-form">
            <label className="password-label" for="password">
                Enter Your Email Address:
            </label>
            <input
                type="email"
                id="email"
                className="email-input"
                data-test="email-input"
                size="30"
                minlength="5"
                placeholder="jondoe@example.com"
                v-model="emailInput"
                @keyup.enter="handleSubmit(emailInput as string)"
                v-focus
                required
            />
            <button
                @click="handleSubmit(emailInput as string)"
                type="submit"
                value="Submit"
                className="submit-btn"
                data-test="submit-btn"
            >
                Submit
            </button>
        </span>
        <span v-if="errMessage.length">
            <p data-test="err-message">{{ errMessage }}</p>
        </span>
        <span v-else-if="resSuccessful.length">
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
.email-input {
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
