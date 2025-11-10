<template>
  <div class="page-loader">
    <div class="loader-content">
      <LoadingSpinner size="lg" :message="message" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: 'Loading...',
});
</script>

<style scoped>
.page-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-content {
  padding: 2rem;
}
</style>
