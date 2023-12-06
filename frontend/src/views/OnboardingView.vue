<script setup>
import { ref, watch } from 'vue'
const input = null
const errMessage = ref(null)
const resSuccessful = ref(false)

const handleSubmit = async data => {
    try {
        errMessage.value = null
        resSuccessful.value = false
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
            resSuccessful.value = true
        }
        console.log('jsonRes :=>', jsonRes)
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
        <span v-else-if="resSuccessful">
            <p>Your Email Was Successfully Sent!</p>
        </span>
        <span v-else></span>
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
