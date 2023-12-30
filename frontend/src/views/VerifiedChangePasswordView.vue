<script setup lang="ts">
import { ref, type Ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const changePasswordRoute = import.meta.env.VITE_CHANGE_PASSWORD_ROUTE
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const invalidTokenCode = import.meta.env.VITE_INVALID_TOKEN_CODE

const emailFromCache: Ref<string> = ref('')
const passwordInput: Ref<string> = ref('')
const errMessage: Ref<string> = ref('')
const resSuccessful: Ref<string> = ref('')

// TODO: place in utility class/file
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// TODO: place in utility class/file
const grabStoredCookie = (cookieKey: string): string | undefined => {
    const cookies = document.cookie.split('; ').reduce((prev, current) => {
        const [key, ...value] = current.split('=')
        // TODO: consider refactoring this using a Map
        prev[key] = value.join('=')
        return prev
    }, {})
    const cookieVal = cookieKey in cookies ? cookies[cookieKey] : undefined
    return cookieVal
}

const handleSubmit = async (passwordInput: string): Promise<void> => {
    try {
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
        } else {
            resSuccessful.value = jsonRes.message
            await delay(1000)
            localStorage.removeItem('appname-session-token')
            router.push('/app')
        }
    } catch (err) {
        console.error('ERROR :=>', err)
    }
}

onMounted(async () => {
    const cookie = grabStoredCookie('appname-hash')
    if (!cookie || cookie !== route.params.hash) {
        errMessage.value =
            'Invalid hash provided, please log back in and try again.'
        // TODO: Repeated code, put into utility class
        const logOutRes = await fetch(logoutRoute, {
            method: 'GET',
            credentials: 'include',
        })
        const jsonLogOutRes = await logOutRes.json()
        if (
            jsonLogOutRes.statusCode !== 200 &&
            jsonLogOutRes.code !== invalidTokenCode
        ) {
            console.error('ERROR while logging out :=>', jsonLogOutRes)
        }
        localStorage.removeItem('appname-session-token')
        // END repeated code
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
        <button className="btn" @click="router.push('/app')">Go Back</button>
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
