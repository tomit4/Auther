<script setup lang="ts"></script>

<template>
    <!-- TODO: If logged in (which you should be thanks to vue-router),
        you can now fetch sensitive info about the user, display it here 
        to hammer home the point that this is a protected route -->
    <!-- TODO: Build out a secondary ProvileView.vue that requires auth and 
        shows aforementioned sensitive info there instead of here -->
    <!-- TODO: Build a Logout button as well as a delete my profile button 
        and implement said logic -->
    <!-- TODO: Hitting log out button displays log out form -->
    <!-- TODO: Hitting delete my profile button displays form 
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, deletion of account is complete-->
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
