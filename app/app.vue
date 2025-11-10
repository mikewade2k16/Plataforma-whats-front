<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
      <ToastHost />
     
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">

import ToastHost from '~/components/ui/ToastHost.vue'
import DevAuthControls from '~/components/dev/DevAuthControls.vue'


const modalOpen = ref(false)
</script>