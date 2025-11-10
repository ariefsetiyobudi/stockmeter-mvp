<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <svg
        class="error-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      
      <h2 class="error-title">{{ title }}</h2>
      <p class="error-message">{{ message }}</p>
      
      <div v-if="showDetails && error" class="error-details">
        <details>
          <summary>Error Details</summary>
          <pre>{{ error }}</pre>
        </details>
      </div>
      
      <div class="error-actions">
        <button @click="retry" class="btn-retry">
          Try Again
        </button>
        <button @click="goHome" class="btn-home">
          Go Home
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

interface Props {
  title?: string;
  message?: string;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  showDetails: false,
});

const error = ref<Error | null>(null);

onErrorCaptured((err: Error) => {
  error.value = err;
  console.error('Error caught by boundary:', err);
  
  // Prevent error from propagating
  return false;
});

const retry = () => {
  error.value = null;
  // Force re-render by reloading the page
  window.location.reload();
};

const goHome = () => {
  error.value = null;
  navigateTo('/');
};
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f9fafb;
}

.error-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
  margin: 0 auto 1.5rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.error-details {
  margin-bottom: 2rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.error-details pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #374151;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-retry,
.btn-home {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-retry {
  background: #111827;
  color: white;
}

.btn-retry:hover {
  background: #374151;
}

.btn-home {
  background: #f3f4f6;
  color: #374151;
}

.btn-home:hover {
  background: #e5e7eb;
}

@media (max-width: 640px) {
  .error-content {
    padding: 2rem 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-retry,
  .btn-home {
    width: 100%;
  }
}
</style>
