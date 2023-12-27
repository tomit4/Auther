<script setup lang="ts">
// NOTE: Just for demo purposes regarding vue props (possibly put user email here?)
defineProps({
    emailFromCache: String,
})
// NOTE: Very explicit form of emits, technically in the button,
// we could just $emit('goBack') inside the @click event handler
const emit = defineEmits(['goBack'])
const goBack = () => emit('goBack')
</script>

<template>
    <div>
        <p>You're about to change the password for {{ emailFromCache }}</p>
        <button @click="goBack">Go Back To App</button>
    </div>
</template>

<style scoped></style>
