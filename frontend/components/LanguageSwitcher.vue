<template>
  <div class="language-switcher">
    <button
      @click="toggleDropdown"
      class="language-btn"
      :aria-label="$t('nav.language')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span class="language-code">{{ currentLocale.toUpperCase() }}</span>
      <svg class="w-4 h-4 chevron" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <transition name="dropdown">
      <div v-if="isOpen" class="language-dropdown">
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="changeLanguage(locale.code)"
          class="language-option"
          :class="{ active: currentLocale === locale.code }"
        >
          <span class="language-flag">{{ getFlag(locale.code) }}</span>
          <span class="language-name">{{ locale.name }}</span>
          <svg v-if="currentLocale === locale.code" class="w-5 h-5 check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const { locale, locales, setLocale } = useI18n();
const { isAuthenticated } = useAuth();
const config = useRuntimeConfig();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const currentLocale = computed(() => locale.value);
const availableLocales = computed(() => {
  return [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' }
  ];
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const changeLanguage = async (newLocale: string) => {
  if (newLocale === currentLocale.value) {
    isOpen.value = false;
    return;
  }

  // Set locale
  await setLocale(newLocale);
  isOpen.value = false;

  // Persist to user profile if authenticated
  if (isAuthenticated.value) {
    try {
      const authStore = useAuthStore();
      await $fetch('/api/user/preferences', {
        baseURL: config.public.apiBaseUrl,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        body: {
          languagePreference: newLocale,
        },
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }
};

const getFlag = (code: string): string => {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    id: '🇮🇩',
  };
  return flags[code] || '🌐';
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.language-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.language-code {
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.chevron {
  transition: transform 0.2s;
}

.chevron.rotate-180 {
  transform: rotate(180deg);
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 50;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  color: #374151;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.language-option:hover {
  background: #f9fafb;
}

.language-option.active {
  background: #eff6ff;
  color: #2563eb;
}

.language-flag {
  font-size: 1.25rem;
  line-height: 1;
}

.language-name {
  flex: 1;
  font-weight: 500;
}

.check-icon {
  color: #2563eb;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .language-dropdown {
    right: auto;
    left: 0;
  }
}
</style>
