<script setup lang="ts">
// TODO: onMounted immediately queries the backend to check if JWT is valid

/* TODO: implement logic that deals with session/access tokens 
    (i.e. one expires short term, and simply checks against longer 
    term session token, if session token is valid, reissue access, 
    otherwise log out) */
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
