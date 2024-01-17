<script setup lang="ts">
defineProps({
    emailFromCache: String,
})
</script>

<template>
    <div className="app-dash">
        <h1>App</h1>
        <p data-test="greeting">Welcome {{ emailFromCache }}!!</p>
        <button
            @click="$emit('handleLogout')"
            type="submit"
            value="Submit"
            className="btn logout-btn"
            data-test="logout-btn"
        >
            Log Out
        </button>
        <br />
        <button
            @click="$emit('toggleChangePasswordForm')"
            type="submit"
            value="Submit"
            className="btn change-password-btn"
            data-test="change-password-btn"
        >
            Change Password
        </button>
        <br />
        <button
            @click="$emit('toggleDeleteProfileForm')"
            type="submit"
            value="Submit"
            className="btn delete-profile-btn"
            data-test="delete-profile-btn"
        >
            Delete My Profile
        </button>
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
