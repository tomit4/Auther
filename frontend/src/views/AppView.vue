<script setup lang="ts">
import { onMounted } from 'vue'
const authRoute = import.meta.env.VITE_AUTH_ROUTE

// TODO: Change the logic here to grab the jwt from localstorage and set it in the authorization headers.
// TODO: set up a single route that will talk to the backend which is protected. this route is also protected using vue-router. if 401 (unauthorized) is returned, reroute to home, otherwise give access to sensitive data (in this case email and password, why not for demo purposes only obviously).

// Simply sends the cookies over to be verifed in /auth on backend
onMounted(async () => {
    await fetch(authRoute, {
        method: 'GET',
        credentials: 'include',
    })
})
</script>

<template>
    <!-- TODO: protect this route with auth/login (i.e. JWT/DB logic)-->
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
