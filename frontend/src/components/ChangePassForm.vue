<script setup lang="ts">
// NOTE: Just for demo purposes regarding vue props (possibly put user email here?)
const props = defineProps({
    msgCustom: String,
})
const emit = defineEmits(['goBack'])

const goBack = () => {
    emit('goBack')
}
</script>

<template>
    <div>
        <h1>Change Password</h1>
        <p>msg in ChangePassForm: {{ props.msgCustom }}</p>
        <button @click="goBack">Go Back To App</button>
    </div>
</template>

<style scoped></style>
