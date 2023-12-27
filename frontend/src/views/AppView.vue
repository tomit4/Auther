<script setup lang="ts">
import ChangePassForm from '../components/ChangePassForm.vue'
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const showDash: Ref<boolean> = ref(true)
const showChangePassForm: Ref<boolean> = ref(false)
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE

// NOTE: Just for demo purposes regarding vue props (possibly put user email here?)
type PropTypes = {
    msgCustom?: string
}

const props = withDefaults(defineProps<PropTypes>(), {
    msgCustom: 'hello world',
})

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

const toggleChangePasswordForm = (): void => {
    showDash.value = !showDash.value
    showChangePassForm.value = !showDash.value
    console.log('change password logic goes here :=>')
}

const handleDeleteProfile = (): void => {
    console.log('delete profile logic goes here :=>')
}
</script>

<template>
    <!-- NOTE: How do we get the user's unhashed sensitive email 
        (aka their userId) back to them here securely? -->
    <!-- TODO: Hitting change password button displays form/hides other buttons
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, user is redirected back to similar sign up page that asks 
        for new password (email is filled out by redis cache)-->
    <!-- TODO: Hitting delete my profile button displays form/hides other buttons
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, deletion of account is complete-->
    <div>
        <div v-if="showDash" className="app-dash">
            <h1>App</h1>
            <button
                @click="handleLogOut"
                type="submit"
                value="Submit"
                className="btn logout-btn"
            >
                Log Out
            </button>
            <br />
            <button
                @click="toggleChangePasswordForm"
                type="submit"
                value="Submit"
                className="btn change-password-btn"
            >
                Change Password
            </button>
            <br />
            <button
                @click="handleDeleteProfile"
                type="submit"
                value="Submit"
                className="btn delete-profile-btn"
            >
                Delete My Profile
            </button>
        </div>
        <div>
            <ChangePassForm
                v-if="showChangePassForm"
                @go-back="toggleChangePasswordForm"
                :msg-custom="props.msgCustom"
            />
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
