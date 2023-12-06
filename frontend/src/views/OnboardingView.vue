<script setup>
const handleSubmit = async () => {
    try {
        const res = await fetch('http://localhost:3000/')
        const jsonRes = await res.json()
        if (!res.ok) throw Error('Resource Not Found')
        console.log('jsonRes :=>', jsonRes)
    } catch (err) {
        console.error(err)
    }
}
</script>

<template>
    <div>
        <h1>Onboarding</h1>
        <br />
        <span className="email-form">
            <label for="email">Email Me At:</label>
            <input
                type="email"
                id="email"
                className="email-input"
                size="30"
                minlength="5"
                placeholder="jondoe@example.com"
                @keyup.enter="handleSubmit()"
                required
            />
            <br />
            <button
                @click="handleSubmit()"
                type="submit"
                value="Submit"
                className="submit-btn"
            >
                Submit
            </button>
        </span>
    </div>
</template>

<style scoped>
.email-fieldset {
    display: block;
    justify-content: center;
    border: none;
}
.email-input {
    display: flex;
    text-align: center;
    margin: 1em auto;
}
.submit-btn {
    display: flex;
    margin: 0 auto;
    margin-top: -2em;
}
</style>
