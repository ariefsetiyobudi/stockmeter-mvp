<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('alerts.title') }}</h1>
        <p class="mt-2 text-gray-600">{{ $t('alerts.subtitle') }}</p>
      </div>

      <!-- Upgrade Prompt for Free Users -->
      <div v-if="!isPro" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="max-w-md mx-auto">
          <svg
            class="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            {{ $t('alerts.upgradeRequired') }}
          </h2>
          <p class="text-gray-600 mb-6">
            {{ $t('alerts.upgradeMessage') }}
          </p>
          <NuxtLink
            to="/pricing"
            class="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {{ $t('alerts.upgradeCta') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Alerts Content for Pro Users -->
      <div v-else>
        <!-- Create Alert Button -->
        <div class="mb-6">
          <button
            @click="showAlertForm = true"
            class="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {{ $t('alerts.createAlert') }}
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg
            class="w-8 h-8 mx-auto text-gray-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p class="mt-4 text-gray-600">Loading alerts...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-white rounded-lg shadow-sm p-8">
          <div class="text-center">
            <p class="text-red-600">{{ error }}</p>
            <button
              @click="loadAlerts"
              class="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="alerts.length === 0" class="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg
            class="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ $t('alerts.noAlerts') }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{ $t('alerts.noAlertsMessage') }}
          </p>
          <button
            @click="showAlertForm = true"
            class="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {{ $t('alerts.createAlert') }}
          </button>
        </div>

        <!-- Alerts List -->
        <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('alerts.ticker') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('alerts.thresholdType') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('alerts.thresholdValue') }}
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {{ $t('alerts.createdAt') }}
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="alert in alerts" :key="alert.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <NuxtLink
                      :to="`/stocks/${alert.ticker}`"
                      class="text-sm font-semibold text-black hover:underline"
                    >
                      {{ alert.ticker }}
                    </NuxtLink>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="{
                        'bg-green-100 text-green-800': alert.thresholdType === 'undervalued',
                        'bg-red-100 text-red-800': alert.thresholdType === 'overvalued',
                        'bg-gray-100 text-gray-800': alert.thresholdType === 'fair',
                      }"
                    >
                      {{ $t(`alerts.${alert.thresholdType}`) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ alert.thresholdValue }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="{
                        'bg-green-100 text-green-800': alert.status === 'active',
                        'bg-gray-100 text-gray-800': alert.status === 'inactive',
                      }"
                    >
                      {{ $t(`alerts.${alert.status}`) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(alert.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end gap-2">
                      <!-- Toggle Active/Inactive -->
                      <button
                        @click="toggleAlertStatus(alert)"
                        class="text-gray-600 hover:text-gray-900 transition-colors"
                        :title="alert.status === 'active' ? $t('alerts.deactivate') : $t('alerts.activate')"
                      >
                        <svg
                          v-if="alert.status === 'active'"
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </button>
                      
                      <!-- Delete -->
                      <button
                        @click="deleteAlert(alert)"
                        class="text-red-600 hover:text-red-900 transition-colors"
                        :title="$t('alerts.delete')"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Form Modal -->
    <div
      v-if="showAlertForm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showAlertForm = false"
    >
      <AlertForm
        @close="showAlertForm = false"
        @created="handleAlertCreated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

definePageMeta({
  middleware: 'auth',
});

interface Alert {
  id: string;
  ticker: string;
  thresholdType: 'undervalued' | 'overvalued' | 'fair';
  thresholdValue: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const config = useRuntimeConfig();
const { isPro } = useAuth();
const authStore = useAuthStore();

const alerts = ref<Alert[]>([]);
const loading = ref(false);
const error = ref('');
const showAlertForm = ref(false);

// Load alerts
const loadAlerts = async () => {
  if (!isPro.value) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await $fetch<{ data: Alert[] }>('/api/alerts', {
      baseURL: config.public.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      credentials: 'include',
    });

    alerts.value = response.data;
  } catch (err: any) {
    console.error('Error loading alerts:', err);
    error.value = err.data?.error?.message || 'Failed to load alerts';
  } finally {
    loading.value = false;
  }
};

// Toggle alert status
const toggleAlertStatus = async (alertItem: Alert) => {
  const newStatus = alertItem.status === 'active' ? 'inactive' : 'active';

  try {
    await $fetch(`/api/alerts/${alertItem.id}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      body: {
        status: newStatus,
      },
      credentials: 'include',
    });

    // Update local state
    alertItem.status = newStatus;
  } catch (err: any) {
    console.error('Error toggling alert status:', err);
    window.alert('Failed to update alert status');
  }
};

// Delete alert
const deleteAlert = async (alertItem: Alert) => {
  if (!confirm('Are you sure you want to delete this alert?')) {
    return;
  }

  try {
    await $fetch(`/api/alerts/${alertItem.id}`, {
      baseURL: config.public.apiBaseUrl,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
      credentials: 'include',
    });

    // Remove from local state
    alerts.value = alerts.value.filter(a => a.id !== alertItem.id);
  } catch (err: any) {
    console.error('Error deleting alert:', err);
    window.alert('Failed to delete alert');
  }
};

// Handle alert created
const handleAlertCreated = () => {
  loadAlerts();
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Load alerts on mount
onMounted(() => {
  if (isPro.value) {
    loadAlerts();
  }
});
</script>
