<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-2xl font-bold text-black">
              Stockmeter
            </NuxtLink>
          </div>
          <div class="flex items-center space-x-4">
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/watchlist"
                class="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                Watchlist
              </NuxtLink>
              <NuxtLink
                to="/compare"
                class="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                Compare
              </NuxtLink>
              <span class="text-gray-700">{{ user?.name }}</span>
              <span v-if="isPro" class="px-2 py-1 text-xs font-semibold text-white bg-black rounded">
                PRO
              </span>
              <button
                @click="handleLogout"
                class="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="text-gray-700 hover:text-black px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back Button -->
      <button
        @click="router.back()"
        class="flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <!-- Loading State -->
      <div v-if="detailLoading || fairValueLoading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="detailError || fairValueError" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-700">{{ detailError || fairValueError }}</p>
        <button
          @click="loadData"
          class="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Stock Detail Content -->
      <div v-else-if="stockDetail && fairValue">
        <!-- Stock Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-black mb-2">
                {{ stockDetail.profile.name }}
              </h1>
              <div class="flex items-center space-x-4 text-gray-600 mb-4">
                <span class="text-xl font-semibold">{{ stockDetail.profile.ticker }}</span>
                <span>{{ stockDetail.profile.exchange }}</span>
                <span class="px-2 py-1 bg-gray-100 rounded text-sm">{{ stockDetail.profile.sector }}</span>
              </div>
              <p class="text-gray-700 mb-4">
                {{ stockDetail.profile.description }}
              </p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div class="text-gray-500">Industry</div>
                  <div class="font-medium text-black">{{ stockDetail.profile.industry }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Market Cap</div>
                  <div class="font-medium text-black">{{ formatMarketCap(stockDetail.profile.marketCap) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Shares Outstanding</div>
                  <div class="font-medium text-black">{{ formatShares(stockDetail.profile.sharesOutstanding) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Currency</div>
                  <div class="font-medium text-black">{{ stockDetail.price.currency }}</div>
                </div>
              </div>
            </div>

            <!-- Current Price -->
            <div class="mt-6 md:mt-0 md:ml-8 text-center md:text-right">
              <div class="text-sm text-gray-500 mb-1">Current Price</div>
              <div class="text-4xl font-bold text-black mb-2">
                {{ formatCurrency(stockDetail.price.price) }}
              </div>
              <div class="text-xs text-gray-500">
                Updated: {{ formatDate(stockDetail.price.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex flex-wrap gap-3">
            <button
              v-if="isAuthenticated"
              @click="handleAddToWatchlist"
              :disabled="addingToWatchlist"
              class="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {{ addingToWatchlist ? 'Adding...' : 'Add to Watchlist' }}
            </button>

            <NuxtLink
              v-if="isPro"
              :to="`/stocks/${ticker}/details`"
              class="flex items-center px-4 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Detailed Breakdown
            </NuxtLink>

            <button
              v-else-if="isAuthenticated"
              @click="showUpgradePrompt = true"
              class="flex items-center px-4 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Detailed Breakdown (Pro)
            </button>
          </div>
        </div>

        <!-- Valuation Status Overview -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 class="text-2xl font-bold text-black mb-4">Valuation Status</h2>
          <div
            class="inline-flex items-center px-6 py-3 rounded-lg text-lg font-semibold"
            :class="overallStatusClasses"
          >
            <span class="w-3 h-3 rounded-full mr-3" :class="overallStatusDotClasses"></span>
            {{ overallStatusText }}
          </div>
          <p class="mt-4 text-gray-600">
            Based on {{ applicableModelsCount }} valuation model{{ applicableModelsCount !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Fair Value Models -->
        <div>
          <h2 class="text-2xl font-bold text-black mb-6">Fair Value Analysis</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- DCF Model -->
            <FairValueCard
              model-name="Discounted Cash Flow (DCF)"
              :fair-value="fairValue.dcf.fairValue"
              :current-price="stockDetail.price.price"
              :assumptions="fairValue.dcf.assumptions"
            />

            <!-- DDM Model -->
            <FairValueCard
              model-name="Dividend Discount Model (DDM)"
              :fair-value="fairValue.ddm.applicable ? fairValue.ddm.fairValue : null"
              :current-price="stockDetail.price.price"
              :assumptions="fairValue.ddm.applicable ? fairValue.ddm.assumptions : undefined"
            />

            <!-- P/E Ratio -->
            <FairValueCard
              model-name="P/E Ratio Valuation"
              :fair-value="fairValue.relativeValue.peRatioFairValue"
              :current-price="stockDetail.price.price"
              :assumptions="{
                companyPE: fairValue.relativeValue.companyMetrics.pe,
                industryMedianPE: fairValue.relativeValue.industryMedians.pe
              }"
            />

            <!-- P/B Ratio -->
            <FairValueCard
              model-name="P/B Ratio Valuation"
              :fair-value="fairValue.relativeValue.pbRatioFairValue"
              :current-price="stockDetail.price.price"
              :assumptions="{
                companyPB: fairValue.relativeValue.companyMetrics.pb,
                industryMedianPB: fairValue.relativeValue.industryMedians.pb
              }"
            />

            <!-- P/S Ratio -->
            <FairValueCard
              model-name="P/S Ratio Valuation"
              :fair-value="fairValue.relativeValue.psRatioFairValue"
              :current-price="stockDetail.price.price"
              :assumptions="{
                companyPS: fairValue.relativeValue.companyMetrics.ps,
                industryMedianPS: fairValue.relativeValue.industryMedians.ps
              }"
            />

            <!-- Graham Number -->
            <FairValueCard
              model-name="Graham Number"
              :fair-value="fairValue.graham.applicable ? fairValue.graham.fairValue : null"
              :current-price="stockDetail.price.price"
              :assumptions="fairValue.graham.applicable ? fairValue.graham.assumptions : undefined"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Upgrade Prompt Modal -->
    <div
      v-if="showUpgradePrompt"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showUpgradePrompt = false"
    >
      <div class="bg-white rounded-lg p-8 max-w-md w-full">
        <h3 class="text-2xl font-bold text-black mb-4">Upgrade to Pro</h3>
        <p class="text-gray-600 mb-6">
          Access detailed calculation breakdowns, assumptions, and projected cash flows with a Pro subscription.
        </p>
        <div class="flex space-x-4">
          <NuxtLink
            to="/pricing"
            class="flex-1 bg-black text-white text-center px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Pricing
          </NuxtLink>
          <button
            @click="showUpgradePrompt = false"
            class="flex-1 bg-white text-black border-2 border-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const { isAuthenticated, isPro, user, logout } = useAuth();
const {
  stockDetail,
  detailLoading,
  detailError,
  fairValue,
  fairValueLoading,
  fairValueError,
  getStockDetail,
  getFairValue,
} = useStockData();

const ticker = computed(() => route.params.ticker as string);
const addingToWatchlist = ref(false);
const showUpgradePrompt = ref(false);

// Load data on mount
const loadData = async () => {
  await Promise.all([
    getStockDetail(ticker.value),
    getFairValue(ticker.value),
  ]);
};

onMounted(() => {
  loadData();
});

// Calculate overall valuation status
const overallStatusText = computed(() => {
  if (!fairValue.value) return 'Unknown';
  
  switch (fairValue.value.valuationStatus) {
    case 'undervalued':
      return 'Undervalued';
    case 'overvalued':
      return 'Overvalued';
    default:
      return 'Fairly Priced';
  }
});

const overallStatusClasses = computed(() => {
  if (!fairValue.value) return 'bg-gray-50 text-gray-700 border border-gray-200';
  
  switch (fairValue.value.valuationStatus) {
    case 'undervalued':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'overvalued':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border border-gray-200';
  }
});

const overallStatusDotClasses = computed(() => {
  if (!fairValue.value) return 'bg-gray-400';
  
  switch (fairValue.value.valuationStatus) {
    case 'undervalued':
      return 'bg-green-500';
    case 'overvalued':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
});

// Count applicable models
const applicableModelsCount = computed(() => {
  if (!fairValue.value) return 0;
  
  let count = 1; // DCF is always applicable
  if (fairValue.value.ddm.applicable) count++;
  if (fairValue.value.graham.applicable) count++;
  count += 3; // P/E, P/B, P/S are always applicable
  
  return count;
});

// Format helpers
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMarketCap = (value: number): string => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
};

const formatShares = (value: number): string => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toFixed(0);
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Add to watchlist handler
const handleAddToWatchlist = async () => {
  addingToWatchlist.value = true;
  try {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();
    
    await $fetch('/api/user/watchlist', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      body: { ticker: ticker.value },
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    });
    
    // Show success message (you can add a toast notification here)
    alert('Added to watchlist!');
  } catch (error: any) {
    console.error('Add to watchlist error:', error);
    alert(error.data?.error?.message || 'Failed to add to watchlist');
  } finally {
    addingToWatchlist.value = false;
  }
};

const handleLogout = async () => {
  await logout();
};
</script>
