<template>
  <div :class="['loading-spinner', sizeClass]">
    <svg
      class="spinner"
      :class="colorClass"
      viewBox="0 0 50 50"
    >
      <circle
        class="path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="4"
      />
    </svg>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
});

const sizeClass = computed(() => `size-${props.size}`);
const colorClass = computed(() => `color-${props.color}`);
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  animation: rotate 2s linear infinite;
}

.spinner .path {
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

/* Sizes */
.size-sm .spinner {
  width: 24px;
  height: 24px;
}

.size-md .spinner {
  width: 40px;
  height: 40px;
}

.size-lg .spinner {
  width: 64px;
  height: 64px;
}

/* Colors */
.color-primary {
  stroke: #111827;
}

.color-white {
  stroke: #ffffff;
}

.color-gray {
  stroke: #6b7280;
}

.loading-message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

/* Animations */
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
