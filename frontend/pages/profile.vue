<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('profile.title') }}</h1>
      </div>

      <div class="space-y-6">
        <!-- Account Information -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            {{ $t('profile.accountInfo') }}
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.name') }}
              </label>
              <p class="text-gray-900">{{ user?.name || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.email') }}
              </label>
              <p class="text-gray-900">{{ user?.email || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.memberSince') }}
              </label>
              <p class="text-gray-900">{{ formatDate(user?.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Subscription Information -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            {{ $t('profile.subscription') }}
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ $t('profile.status') }}
                </label>
                <div class="flex items-center">
                  <span
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      subscriptionStatusClass
                    ]"
                  >
                    {{ subscriptionStatusText }}
                  </span>
                </div>
              </div>
              <button
                v-if="isFree"
                @click="navigateTo('/pricing')"
                class="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                {{ $t('profile.upgrade') }}
              </button>
            </div>

            <div v-if="isPro && user?.subscriptionExpiry">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.renewsOn') }}
              </label>
              <p class="text-gray-900">{{ formatDate(user.subscriptionExpiry) }}</p>
            </div>
          </div>
        </div>

        <!-- Preferences -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            {{ $t('profile.preferences') }}
          </h2>
          <form @submit.prevent="savePreferences" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ $t('profile.language') }}
              </label>
              <select
                v-model="preferences.language"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="id">Indonesian</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ $t('profile.currency') }}
              </label>
              <select
                v-model="preferences.currency"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div v-if="preferenceError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ preferenceError }}</p>
            </div>

            <div v-if="preferenceSuccess" class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-600">{{ preferenceSuccess }}</p>
            </div>

            <button
              type="submit"
              :disabled="isSavingPreferences"
              class="w-full py-3 px-6 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSavingPreferences ? $t('payment.processing') : $t('profile.savePreferences') }}
            </button>
          </form>
        </div>

        <!-- Payment History -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">
            {{ $t('profile.paymentHistory') }}
          </h2>

          <div v-if="isLoadingPayments" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>

          <div v-else-if="payments.length === 0" class="text-center py-8 text-gray-500">
            {{ $t('profile.noPayments') }}
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('profile.date') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('profile.plan') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('profile.amount') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('profile.method') }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('profile.status') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="payment in payments" :key="payment.id">
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(payment.createdAt) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ payment.plan }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ payment.currency }} {{ payment.amount }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {{ payment.provider }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ payment.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useI18n } from 'vue-i18n';

definePageMeta({
  middleware: 'auth'
});

const { user, isPro, isFree } = useAuth();
const authStore = useAuthStore();
const config = useRuntimeConfig();
const { locale } = useI18n();

interface Transaction {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: Date;
}

const preferences = ref({
  language: locale.value || 'en',
  currency: 'USD'
});

const payments = ref<Transaction[]>([]);
const isLoadingPayments = ref(false);
const isSavingPreferences = ref(false);
const preferenceError = ref('');
const preferenceSuccess = ref('');

const subscriptionStatusClass = computed(() => {
  if (isPro.value) return 'bg-green-100 text-green-800';
  if (user.value?.subscriptionStatus === 'expired') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
});

const subscriptionStatusText = computed(() => {
  if (isPro.value) return 'Pro';
  if (user.value?.subscriptionStatus === 'expired') return 'Expired';
  return 'Free';
});

const formatDate = (date: Date | null | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const loadPaymentHistory = async () => {
  isLoadingPayments.value = true;
  try {
    const response = await $fetch<Transaction[]>('/api/user/payments', {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      credentials: 'include'
    });
    payments.value = response;
  } catch (error) {
    console.error('Failed to load payment history:', error);
    // Silently fail - payment history is not critical
  } finally {
    isLoadingPayments.value = false;
  }
};

const loadUserPreferences = async () => {
  try {
    const response = await $fetch<any>('/api/user/profile', {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      credentials: 'include'
    });
    
    if (response.data) {
      preferences.value.language = response.data.languagePreference || 'en';
      preferences.value.currency = response.data.currencyPreference || 'USD';
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
};

const savePreferences = async () => {
  isSavingPreferences.value = true;
  preferenceError.value = '';
  preferenceSuccess.value = '';

  try {
    await $fetch('/api/user/preferences', {
      baseURL: config.public.apiBaseUrl,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      body: {
        languagePreference: preferences.value.language,
        currencyPreference: preferences.value.currency
      },
      credentials: 'include'
    });

    // Update locale
    locale.value = preferences.value.language;
    preferenceSuccess.value = 'Preferences saved successfully!';

    // Clear success message after 3 seconds
    setTimeout(() => {
      preferenceSuccess.value = '';
    }, 3000);
  } catch (error: any) {
    console.error('Failed to save preferences:', error);
    preferenceError.value = error.data?.error?.message || 'Failed to save preferences';
  } finally {
    isSavingPreferences.value = false;
  }
};

onMounted(() => {
  loadUserPreferences();
  loadPaymentHistory();
});
</script>
