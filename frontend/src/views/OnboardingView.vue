<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const input = ref(null)
const errMessage = ref(null)
const resSuccessful = ref('')

const delay = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const handleSubmit = async data => {
    try {
        errMessage.value = null
        resSuccessful.value = ''
        const res = await fetch('http://localhost:3000/email', {
            method: 'POST',
            ContentType: 'application/x-www-form-urlencoded',
            body: data,
        })
        const jsonRes = await res.json()
        if (!res.ok || jsonRes.error) {
            const errMsg = {
                ok: res.ok,
                error: jsonRes.error,
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
                @keyup.enter="handleSubmit(input)"
                required
            />
            <br />
            <button
                @click="handleSubmit(input)"
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
