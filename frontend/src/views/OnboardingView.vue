<script setup lang="ts">
import { ref, Ref } from 'vue'
import { useRouter } from 'vue-router'
const emailRoute = import.meta.env.VITE_EMAIL_ROUTE
const router = useRouter()
const input: Ref<null> = ref(null)
const errMessage: Ref<null> = ref(null)
const resSuccessful: Ref<string> = ref('')

const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const handleSubmit = async (data: string): Promise<void> => {
    try {
        errMessage.value = null
        resSuccessful.value = ''
        const res = await fetch(emailRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: data,
        })
        const jsonRes = await res.json()
        if (!res.ok || jsonRes.error) {
            const errMsg = {
                ok: res.ok,
                error: jsonRes.error ? jsonRes.error : 'Unknown error occurred',
            }
            errMessage.value = errMsg.error
            throw Error(`An error occurred: ${JSON.stringify(errMsg)}`)
        } else {
            resSuccessful.value = jsonRes.email
            await delay(1000)
            router.push('/auth')
        }
    } catch (err) {
        console.error(err)
    }
}
</script>

<template>
    <div>
        <h1>Onboarding</h1>
        <br />
        <span className="email-form">
            <label for="email">Email Me At:</label>
            <input
                type="email"
                id="email"
                className="email-input"
                size="30"
                minlength="5"
                placeholder="jondoe@example.com"
                v-model="input"
                @keyup.enter="handleSubmit(String(input))"
                required
            />
            <br />
            <button
                @click="handleSubmit(String(input))"
                type="submit"
                value="Submit"
                className="submit-btn"
            >
                Submit
            </button>
        </span>
        <span v-if="errMessage">
            <p>{{ errMessage }}</p>
        </span>
        <span v-else-if="resSuccessful.length">
            <p>Your Email Was Successfully Sent to {{ resSuccessful }}!</p>
        </span>
        <span v-else />
    </div>
</template>

<style scoped>
.email-fieldset {
    display: block;
    justify-content: center;
    border: none;
}
.email-input {
    display: flex;
    text-align: center;
    margin: 1em auto;
}
.submit-btn {
    display: flex;
    margin: 0 auto;
    margin-top: -2em;
}
</style>
