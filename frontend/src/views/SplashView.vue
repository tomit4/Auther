<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
    <div>
        <h1 data-test="h1">Splash</h1>
        <br />
        <div className="onboard">
            <button
                @click="router.push('/signup')"
                type="submit"
                value="Submit"
                className="btn signup-btn"
                data-test="signup-btn"
            >
                Sign Up
            </button>
            <br />
            <button
                @click="router.push('/login')"
                type="submit"
                value="Submit"
                className="btn login-btn"
                data-test="login-btn"
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
