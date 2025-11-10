import { ref, onMounted, onUnmounted } from 'vue';

export const useNetworkStatus = () => {
  const isOnline = ref(true);
  const connectionType = ref<string>('unknown');
  const effectiveType = ref<string>('4g');
  const saveData = ref(false);

  const updateNetworkStatus = () => {
    isOnline.value = navigator.onLine;

    // Check Network Information API support
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        connectionType.value = connection.type || 'unknown';
        effectiveType.value = connection.effectiveType || '4g';
        saveData.value = connection.saveData || false;
      }
    }
  };

  const handleOnline = () => {
    isOnline.value = true;
  };

  const handleOffline = () => {
    isOnline.value = false;
  };

  const handleConnectionChange = () => {
    updateNetworkStatus();
  };

  onMounted(() => {
    if (process.client) {
      updateNetworkStatus();

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Listen for connection changes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.addEventListener('change', handleConnectionChange);
        }
      }
    }
  });

  onUnmounted(() => {
    if (process.client) {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
    }
  });

  // Helper to determine if we should load high-quality assets
  const shouldLoadHighQuality = computed(() => {
    // Don't load high quality if:
    // - User has data saver enabled
    // - Connection is slow (2g or slow-2g)
    if (saveData.value) return false;
    if (effectiveType.value === '2g' || effectiveType.value === 'slow-2g') return false;
    return true;
  });

  return {
    isOnline,
    connectionType,
    effectiveType,
    saveData,
    shouldLoadHighQuality
  };
};
