<script setup lang="ts">
import { onMounted } from 'vue'
const authRoute = import.meta.env.VITE_AUTH_ROUTE

// TODO: Change the logic here to grab the jwt from localstorage and set it in the authorization headers.
// TODO: set up a single route that will talk to the backend which is protected. this route is also protected using vue-router. if 401 (unauthorized) is returned, reroute to home, otherwise give access to sensitive data (in this case email and password, why not for demo purposes only obviously).

// Simply sends the cookies over to be verifed in /auth on backend
onMounted(async () => {
    const token = localStorage.getItem('appname-token')
    const res = await fetch(authRoute, {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
    })
    try {
        const jsonRes = await res.json()
        if (!res.ok || jsonRes.error) {
            const errMsg = {
                ok: res.ok,
                error: jsonRes.error ? jsonRes.error : 'Unknown error occurred',
            }
            throw Error(`An error occurred: ${JSON.stringify(errMsg)}`)
        } else {
            console.log('jsonRes :=>', jsonRes)
        }
    } catch (err) {
        if (err instanceof Error) {
            // NOTE: If the localStorage token is invalid,
            // we then need to check to see if the refresh token is still valid (cookie token),
            // if the refresh/cookie token is still valid,
            // then we need to generate a new jwt on the backend and set it here in local storage,
            // else
            // then we need to render the error to the user briefly before redirecting them back home.
            console.error('ERROR :=>', err.message) // {"ok":false,"error":"Unauthorized"}
        }
    }
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
