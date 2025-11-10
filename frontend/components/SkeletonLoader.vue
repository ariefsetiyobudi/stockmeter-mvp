<template>
  <div :class="['skeleton-loader', typeClass]" :style="customStyle">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'custom';
  width?: string;
  height?: string;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  rounded: false,
});

const typeClass = computed(() => `skeleton-${props.type}`);

const customStyle = computed(() => {
  const style: Record<string, string> = {};
  
  if (props.width) {
    style.width = props.width;
  }
  
  if (props.height) {
    style.height = props.height;
  }
  
  if (props.rounded) {
    style.borderRadius = '9999px';
  }
  
  return style;
});
</script>

<style scoped>
.skeleton-loader {
  position: relative;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 0.25rem;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

/* Predefined types */
.skeleton-text {
  width: 100%;
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-title {
  width: 60%;
  height: 1.5rem;
  margin-bottom: 0.75rem;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-card {
  width: 100%;
  height: 200px;
  border-radius: 0.5rem;
}

.skeleton-button {
  width: 120px;
  height: 40px;
  border-radius: 0.375rem;
}

.skeleton-custom {
  /* Custom dimensions set via props */
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
