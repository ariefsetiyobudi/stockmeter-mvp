<template>
  <div>
    <ErrorBoundary>
      <NuxtPage />
    </ErrorBoundary>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
// Root app component with performance optimizations
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'format-detection', content: 'telephone=no' }
  ]
});

// Preload critical resources
onMounted(() => {
  // Prefetch navigation routes for faster transitions
  if (process.client) {
    const router = useRouter();
    
    // Prefetch common routes after initial load
    setTimeout(() => {
      router.prefetch('/login');
      router.prefetch('/register');
      router.prefetch('/pricing');
    }, 2000);
  }
});
</script>

<style>
/* Prevent layout shift */
html {
  scroll-behavior: smooth;
}

/* Optimize font rendering */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
