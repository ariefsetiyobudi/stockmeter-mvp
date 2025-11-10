/**
 * Toast Notification Composable
 * Provides global toast notifications for success, error, warning, and info messages
 */

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export const useToast = () => {
  const show = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    
    const toast: Toast = {
      id,
      type,
      message,
      duration,
    };

    toasts.value.push(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  };

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (message: string, duration?: number) => {
    return show(message, 'success', duration);
  };

  const error = (message: string, duration?: number) => {
    return show(message, 'error', duration);
  };

  const warning = (message: string, duration?: number) => {
    return show(message, 'warning', duration);
  };

  const info = (message: string, duration?: number) => {
    return show(message, 'info', duration);
  };

  const clear = () => {
    toasts.value = [];
  };

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  };
};
