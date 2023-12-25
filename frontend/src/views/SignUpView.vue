<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'

const router = useRouter()
const emailInput: Ref<string> = ref('')
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
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
        errMessage.value = ''
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
        if (!res.ok) {
            errMessage.value = jsonRes.message
                ? jsonRes.message
                : 'Unknown error occurred'
            throw Error(`An error occurred: ${JSON.stringify(jsonRes)}`)
        } else {
            resSuccessful.value = jsonRes.message
            // TODO: set up watcher to display count down before redirect
            await delay(1000)
            router.push('/auth')
        }
    } catch (err) {
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
                    handleSubmit(emailInput as string, passwordInput as string)
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
                    handleSubmit(emailInput as string, passwordInput as string)
                "
                required
            />
            <!-- TODO: Integrate zod here to validate if is email and if password passes 
                specific params (i.e. length, special characters, numbers, 
                capitalized letters, etc.) (see backend for reference) -->
            <!-- TODO: Setup a vue watcher to tell if email/password are valid 
                and notify user if they are/aren't -->
            <button
                @click="
                    handleSubmit(emailInput as string, passwordInput as string)
                "
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
