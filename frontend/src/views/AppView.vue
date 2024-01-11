<script setup lang="ts">
import AppDash from '../components/AppDash.vue'
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
        <AppDash
            v-if="showDash"
            :email-from-cache="emailFromCache"
            @handle-logout="handleLogout"
            @toggle-change-password-form="toggleChangePasswordForm"
            @toggle-delete-profile-form="toggleDeleteProfileForm"
        />
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

<style scoped></style>
