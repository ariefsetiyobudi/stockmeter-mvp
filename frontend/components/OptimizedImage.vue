<template>
  <img
    :src="src"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    decoding="async"
    @load="onLoad"
    @error="onError"
  />
</template>

<script setup lang="ts">
interface Props {
  src: string;
  alt: string;
  imgClass?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  load: [];
  error: [];
}>();

const onLoad = () => {
  emit('load');
};

const onError = () => {
  emit('error');
};
</script>
