import { ref, onMounted, onUnmounted } from 'vue';

export const useLazyLoad = (elementRef: Ref<HTMLElement | null>, options?: IntersectionObserverInit) => {
  const isVisible = ref(false);
  const hasLoaded = ref(false);
  let observer: IntersectionObserver | null = null;

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options
  };

  onMounted(() => {
    if (process.client && 'IntersectionObserver' in window && elementRef.value) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded.value) {
            isVisible.value = true;
            hasLoaded.value = true;
            
            // Disconnect after first load
            if (observer) {
              observer.disconnect();
            }
          }
        });
      }, defaultOptions);

      observer.observe(elementRef.value);
    } else {
      // Fallback for browsers without IntersectionObserver
      isVisible.value = true;
      hasLoaded.value = true;
    }
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return {
    isVisible,
    hasLoaded
  };
};
