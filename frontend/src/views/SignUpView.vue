<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const emailInput: Ref<string> = ref('')
const passwordInput: Ref<null> = ref(null)
const errMessage: Ref<null> = ref(null)
const resSuccessful: Ref<string> = ref('')

const emailRoute = import.meta.env.VITE_EMAIL_ROUTE as string
// TODO: place in a utility class/file
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const handleSubmit = async (
    emailInput: string,
    passwordInput: string,
): Promise<void> => {
    try {
        errMessage.value = null
        resSuccessful.value = ''
        const data = {
            email: emailInput,
            password: passwordInput,
        }
        const res = await fetch(emailRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
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
            resSuccessful.value = jsonRes.msg
            // TODO: set up watcher to display count down before redirect
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
        <h1>Sign Up</h1>
        <br />
        <span className="email-form">
            <label className="email-label" for="email">Email Me At:</label>
            <input
                type="email"
                id="email"
                className="email-input"
                size="30"
                minlength="5"
                placeholder="jondoe@example.com"
                v-model="emailInput"
                @keyup.enter="
                    handleSubmit(String(emailInput), String(passwordInput))
                "
                v-focus
                required
            />
            <br />
            <label className="password-label" for="password"
                >Create A Password:</label
            >
            <input
                type="password"
                id="password"
                className="password-input"
                size="30"
                minlength="10"
                placeholder="Password1234!"
                v-model="passwordInput"
                @keyup.enter="
                    handleSubmit(String(emailInput), String(passwordInput))
                "
                required
            />
            <!-- TODO: Integrate zod here to validate if is email and if password passes 
                specific params (i.e. length, special characters, numbers, 
                capitalized letters, etc.) (see backend for reference) -->
            <!-- TODO: Setup a vue watcher to tell if email/password are valid 
                and notify user if they are/aren't -->
            <button
                @click="handleSubmit(String(emailInput), String(passwordInput))"
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
            <p>{{ resSuccessful }}</p>
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
</style>
