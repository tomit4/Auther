<script setup lang="ts">
import ChangePassForm from '../components/ChangePassForm.vue'
import DeleteProfileForm from '../components/DeleteProfileForm.vue'
import { ref, type Ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE

const showDash: Ref<boolean> = ref(true)
const showChangePassForm: Ref<boolean> = ref(false)
const showDeleteProfileForm: Ref<boolean> = ref(false)
const emailFromCache: Ref<string> = ref('')

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
}

const toggleDeleteProfileForm = (): void => {
    showDash.value = !showDash.value
    showDeleteProfileForm.value = !showDash.value
}

onMounted(async (): Promise<void> => {
    try {
        const res = await fetch(grabUserIdRoute, {
            method: 'GET',
            credentials: 'include',
        })
        const jsonRes = await res.json()
        emailFromCache.value = jsonRes.email
    } catch (err) {
        localStorage.removeItem('appname-session-token')
        router.push('/login')
    }
})
</script>

<template>
    <!-- TODO: Hitting delete my profile button displays form/hides other buttons
        form asks for email/password, sends transac email for confirmation, 
        then upon confirmation, deletion of account is complete -->
    <!-- NOTE: Deletion of account includes a new table field in the db 'is_deleted'
        which is set to true upon deletion -->
    <!-- NOTE: This will require readjustment of our db queries as they stand 
        currently to check for this new 'is_deleted' field -->
    <div>
        <h1>App</h1>
        <div v-if="showDash" className="app-dash">
            <!-- TODO: Make this its own component passing props/emitting etc. -->
            <p>Welcome {{ emailFromCache }}!!</p>
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
                @click="toggleDeleteProfileForm"
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
                :email-from-cache="emailFromCache"
            />
        </div>
        <div>
            <DeleteProfileForm
                v-if="showDeleteProfileForm"
                @go-back="toggleDeleteProfileForm"
                :email-from-cache="emailFromCache"
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
