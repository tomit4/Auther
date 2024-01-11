<script setup lang="ts">
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { delay } from '../utils/utils.ts'
import { validatePasswordInput } from '../utils/schema-validators'

const router = useRouter()
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

const deleteProfileAskRoute = import.meta.env
    .VITE_DELETE_PROFILE_ASK_ROUTE as string

defineProps({
    emailFromCache: String,
})

const handleSubmit = async (passwordInput: string): Promise<void> => {
    try {
        errMessage.value = ''
        resSuccessful.value = ''
        validatePasswordInput(passwordInput)
        const data = {
            loginPassword: passwordInput,
        }
        const res = await fetch(deleteProfileAskRoute, {
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
            localStorage.removeItem('appname-session-token')
            throw Error(jsonRes.message)
        } else {
            resSuccessful.value = jsonRes.message
        }
        await delay(1000)
        router.push('/app')
    } catch (err) {
        if (err instanceof Error) errMessage.value = err.message
        console.error(err)
    }
}
</script>

<template>
    <div>
        <p>You're about to delete the profile for {{ emailFromCache }}</p>
        <span className="password-form">
            <label className="password-label" for="password">
                Enter Your Password:
            </label>
            <input
                type="password"
                id="password"
                className="password-input"
                size="30"
                minlength="10"
                placeholder="Password1234!"
                v-model="passwordInput"
                v-focus
                @keyup.enter="handleSubmit(passwordInput as string)"
                required
            />
            <button
                @click="handleSubmit(passwordInput as string)"
                type="submit"
                value="Submit"
                className="submit-btn"
            >
                Submit
            </button>
        </span>
        <button className="btn" @click="$emit('goBack')">Go Back</button>
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
