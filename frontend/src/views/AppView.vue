<script setup lang="ts">
import ChangePassForm from '../components/ChangePassForm.vue'
import DeleteProfileForm from '../components/DeleteProfileForm.vue'
import { ref, type Ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const invalidTokenCode = import.meta.env.VITE_INVALID_TOKEN_CODE

const showDash: Ref<boolean> = ref(true)
const showChangePassForm: Ref<boolean> = ref(false)
const showDeleteProfileForm: Ref<boolean> = ref(false)
const emailFromCache: Ref<string> = ref('')

const handleLogout = async (): Promise<void> => {
    const logOutRes = (await fetch(logoutRoute, {
        method: 'GET',
        credentials: 'include',
    })) as Response & { code?: number }
    if (!logOutRes.ok && logOutRes.code !== invalidTokenCode)
        console.error('ERROR while logging out :=>', logOutRes)
    localStorage.removeItem('appname-session-token')
    router.push('/login')
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
        if (!res.ok) {
            throw new Error('ERROR while grabbing user id')
        }
        const jsonRes = await res.json()
        emailFromCache.value = jsonRes.email
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message)
        }
        localStorage.removeItem('appname-session-token')
        router.push('/login')
    }
})
</script>

<template>
    <div>
        <h1>App</h1>
        <div v-if="showDash" className="app-dash">
            <!-- TODO: Make this its own component passing props/emitting etc. -->
            <p>Welcome {{ emailFromCache }}!!</p>
            <button
                @click="handleLogout"
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
