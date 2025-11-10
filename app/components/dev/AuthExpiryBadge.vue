<script setup lang="ts">
const { secondsLeft } = useAuthStatus()
const mm = computed(() => Math.floor(secondsLeft.value / 60))
const ss = computed(() => String(secondsLeft.value % 60).padStart(2, '0'))
const show = computed(() => secondsLeft.value > 0)
</script>

<template>
    <div v-if="show" class="dev-expiry">⏳ {{ mm }}:{{ ss }}</div>
</template>

<style scoped>
.dev-expiry {
    position: fixed;
    right: 12px;
    bottom: 78px;
    z-index: 9998;
    background: rgba(0, 0, 0, .6);
    color: #fff;
    padding: 6px 10px;
    border-radius: 10px;
    font: 12px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
    border: 1px solid rgba(255, 255, 255, .15);
}
</style>
