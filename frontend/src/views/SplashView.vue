<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const handleSignUp = (): void => {
    router.push('/signup')
}
const handleLogin = (): void => {
    router.push('/login')
}
</script>

<template>
    <div>
        <h1>Splash</h1>
        <br />
        <div className="onboard">
            <button
                @click="handleSignUp()"
                type="submit"
                value="Submit"
                className="btn signup-btn"
            >
                Sign Up
            </button>
            <br />
            <button
                @click="handleLogin()"
                type="submit"
                value="Submit"
                className="btn login-btn"
            >
                Login
            </button>
        </div>
    </div>
</template>

<style scoped>
.onboard {
    margin-top: -0.5em;
}
.btn {
    cursor: pointer;
    padding: 0.5em;
    font-weight: 700;
    font-size: 100%;
    border: 2px solid black;
    border-radius: 5px;
    margin: 0.5em auto;
}
.login-btn {
    width: 4.5em;
}
</style>
