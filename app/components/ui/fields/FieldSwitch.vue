<template>
    <label class="form-switch">
        <input type="checkbox" v-model="checked" />
        <span class="slider"></span>
    </label>
</template>

<script setup lang="ts">
const model = defineModel<boolean>()
const checked = computed({
    get: () => !!model.value,
    set: (val) => (model.value = val)
})
</script>

<style scoped>
.form-switch {
    position: relative;
    display: inline-block;
    width: 38px;
    height: 20px;
}

.form-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 20px;
    transition: .3s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: .3s;
}

input:checked+.slider {
    background-color: #12b2c1;
}

input:checked+.slider:before {
    transform: translateX(18px);
}
</style>
