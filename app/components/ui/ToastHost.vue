<script setup lang="ts">
const { list } = useToast()
</script>

<template>
    <div class="nx-toast-host">
        <div v-for="t in list" :key="t.id" class="nx-toast" :class="t.level">
            <strong v-if="t.title">{{ t.title }}</strong>
            <span>{{ t.msg }}</span>
        </div>
    </div>
</template>

<style scoped>
.nx-toast-host {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 9999;
    display: grid;
    gap: 8px;
    max-width: min(420px, 90vw);
}

.nx-toast {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(20, 20, 20, .92);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, .1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
    font-size: 14px;
}

.nx-toast.success {
    border-color: rgba(18, 178, 193, .4)
}

.nx-toast.warning {
    border-color: rgba(245, 158, 11, .4)
}

.nx-toast.error {
    border-color: rgba(239, 68, 68, .45)
}
</style>
