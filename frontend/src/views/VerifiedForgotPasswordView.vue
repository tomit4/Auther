<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const forgotPasswordCheckRoute = import.meta.env.VITE_FORGOT_PASS_CHECK_ROUTE

const emailFromCache: Ref<string> = ref('')
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

// TODO: place in utility class/file
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// NOTE: At this point, checks have passed in router/index.ts checks
// TODO: Submit Password to backend along with hashedEmail from secure cookie
// TODO: Change Password by hashedEmail and is_deleted = false
// TODO: If all successful, display message letting user know of success,
// and then delay/redirect to /login
const handleSubmit = async (passwordInput: string): Promise<void> => {
    try {
        const data = {
            newPassword: passwordInput,
        }
        const res = await fetch(forgotPasswordCheckRoute, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        const jsonRes = await res.json()
        if (!res.ok) {
            errMessage.value = jsonRes.message
        } else {
            resSuccessful.value = jsonRes.message
            await delay(1000)
            router.push('/login')
        }
    } catch (err) {
        console.error('ERROR :=>', err)
    }
}

onMounted(async () => {
    try {
        if (!route.params.hash) {
            throw Error('No hash provided')
        }
        const data = {
            hash: route.params.hash,
        }
        const res = await fetch(forgotPasswordCheckRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })
        console.log('res :=>', res)
        const jsonRes = await res.json()
        if (!res.ok || !jsonRes.ok) {
            errMessage.value =
                res.status === 401
                    ? 'You took too long to answer the forgot password email, please try again'
                    : jsonRes.message
            delay(1000)
            router.push('/login')
        } else {
            emailFromCache.value = jsonRes.email
        }
    } catch (err) {
        console.error('ERROR :=>', err)
    }
})
</script>

<template>
    <div>
        <h1>App</h1>
        <p>Please enter your New Password for {{ emailFromCache }}</p>
        <span className="email-form">
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
                @keyup.enter="handleSubmit(passwordInput as string)"
                v-focus
                required
            />
            <!-- TODO: Integrate zod here to validate if is email and if password passes 
                specific params (i.e. length, special characters, numbers, 
                capitalized letters, etc.) (see backend for reference) -->
            <!-- TODO: Setup a vue watcher to tell if email/password are valid 
                and notify user if they are/aren't -->
            <button
                @click="handleSubmit(passwordInput as string)"
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
