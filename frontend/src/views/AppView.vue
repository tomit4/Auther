<script setup lang="ts"></script>

<template>
    <!-- TODO: protect this route with auth/login via vue-router as well -->
    <!-- NOTE: Current implementation flashes this protected page before re 
        routing to /login, thusly we probably need to use vue-router to protect this route-->
    <div>
        <h1>Welcome To My App!</h1>
        <h2>here you should be signed up and logged in!</h2>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 2.5em;
    font-size: 160%;
}
h2 {
    font-size: 120%;
}
</style>
