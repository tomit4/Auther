<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
onMounted(() => {
    console.log('route.params.hash :=>', route.params.hash)
})
</script>

<template>
    <div>
        <h1>Change Your Password:</h1>
    </div>
</template>

<style scoped>
h1 {
    margin-top: 2.5em;
    font-size: 160%;
}
</style>
