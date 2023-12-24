<script setup lang="ts">
import { useRouter } from 'vue-router'
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE

const router = useRouter()
const handleLogOut = async (): Promise<void> => {
    const logOutRes = await fetch(logoutRoute, {
        method: 'GET',
        credentials: 'include',
    })
    if (logOutRes.status === 200) {
        localStorage.removeItem('appname-session-token')
        router.push('/login')
    } else console.error('ERROR while logging out :=>', logOutRes)
}

const handleChangePassword = (): void => {
    console.log('change password logic goes here :=>')
}

const handleDeleteProfile = (): void => {
    console.log('delete profile logic goes here :=>')
}
</script>

<template>
    <!-- TODO: If logged in (which you should be thanks to vue-router),
        you can now fetch sensitive info about the user, display it here 
        to hammer home the point that this is a protected route -->
    <!-- TODO: Build out a secondary ProvileView.vue that requires auth and 
        shows aforementioned sensitive info there instead of here -->
    <!-- TODO: Hitting log out button displays log out form and hides delete button -->
    <!-- TODO: Hitting change password button displays form/hides other buttons
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, user is redirected back to similar sign up page that asks 
        for new password (email is filled out by redis cache)-->
    <!-- TODO: Hitting delete my profile button displays form/hides other buttons
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, deletion of account is complete-->
    <div>
        <h1>App</h1>
        <!-- TODO: Put Route Link To ProfileView Page -->
        <div className="app-dash">
            <button
                @click="handleLogOut()"
                type="submit"
                value="Submit"
                className="btn logout-btn"
            >
                Log Out
            </button>
            <br />
            <button
                @click="handleChangePassword()"
                type="submit"
                value="Submit"
                className="btn change-password-btn"
            >
                Change Password
            </button>
            <br />
            <button
                @click="handleDeleteProfile()"
                type="submit"
                value="Submit"
                className="btn delete-profile-btn"
            >
                Delete My Profile
            </button>
        </div>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 2.5em;
    font-size: 160%;
}
.app-dash {
    margin-top: 1em;
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
.change-password-btn,
.delete-profile-btn {
    width: 9.5em;
}
</style>
