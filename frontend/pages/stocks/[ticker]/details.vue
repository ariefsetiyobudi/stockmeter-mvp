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
      <NuxtLink
        :to="`/stocks/${ticker}`"
        class="flex items-center text-gray-600 hover:text-black mb-6 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to {{ ticker }}
      </NuxtLink>

      <!-- Upgrade Prompt for Free Users -->
      <div v-if="!isPro && isAuthenticated" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <div class="max-w-2xl mx-auto">
          <div class="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-black mb-4">Pro Feature</h2>
          <p class="text-lg text-gray-600 mb-8">
            Detailed model breakdowns with calculation steps, assumptions, and projected cash flows are available exclusively for Pro subscribers.
          </p>
          <div class="space-y-4 mb-8">
            <div class="flex items-start text-left">
              <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-black">Complete Calculation Steps</div>
                <div class="text-gray-600">See exactly how each fair value is calculated</div>
              </div>
            </div>
            <div class="flex items-start text-left">
              <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-black">10-Year Projections</div>
                <div class="text-gray-600">View detailed revenue and cash flow forecasts</div>
              </div>
            </div>
            <div class="flex items-start text-left">
              <svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div class="font-semibold text-black">All Model Assumptions</div>
                <div class="text-gray-600">Understand the inputs behind each valuation</div>
              </div>
            </div>
          </div>
          <NuxtLink
            to="/pricing"
            class="inline-block bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Upgrade to Pro
          </NuxtLink>
        </div>
      </div>

      <!-- Login Prompt for Non-Authenticated Users -->
      <div v-else-if="!isAuthenticated" class="bg-white rounded-lg shadow-sm p-8 text-center">
        <h2 class="text-3xl font-bold text-black mb-4">Sign In Required</h2>
        <p class="text-lg text-gray-600 mb-8">
          Please sign in to access detailed model breakdowns.
        </p>
        <div class="space-x-4">
          <NuxtLink
            to="/login"
            class="inline-block bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="inline-block bg-white text-black border-2 border-black px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Create Account
          </NuxtLink>
        </div>
      </div>

      <!-- Model Details Content (Pro Users Only) -->
      <div v-else>
        <!-- Loading State -->
        <div v-if="modelDetailsLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="modelDetailsError" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p class="text-red-700">{{ modelDetailsError }}</p>
          <button
            @click="loadModelDetails"
            class="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>

        <!-- Model Details -->
        <div v-else-if="modelDetails">
          <h1 class="text-3xl font-bold text-black mb-8">
            Detailed Valuation Breakdown for {{ ticker }}
          </h1>

          <!-- DCF Model Details -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-2xl font-bold text-black mb-4">Discounted Cash Flow (DCF)</h2>
            
            <!-- Assumptions -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Key Assumptions</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Revenue Growth Rate</div>
                  <div class="text-xl font-bold text-black">
                    {{ (modelDetails.dcf.assumptions.revenueGrowthRate * 100).toFixed(2) }}%
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">WACC (Discount Rate)</div>
                  <div class="text-xl font-bold text-black">
                    {{ (modelDetails.dcf.assumptions.wacc * 100).toFixed(2) }}%
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Terminal Growth Rate</div>
                  <div class="text-xl font-bold text-black">
                    {{ (modelDetails.dcf.assumptions.terminalGrowthRate * 100).toFixed(2) }}%
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Projection Period</div>
                  <div class="text-xl font-bold text-black">
                    {{ modelDetails.dcf.assumptions.projectionYears }} years
                  </div>
                </div>
              </div>
            </div>

            <!-- Projected Cash Flows -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Projected Free Cash Flows</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Free Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(fcf, index) in modelDetails.dcf.projectedFCF" :key="index">
                      <td class="px-4 py-3 text-sm text-gray-900">Year {{ index + 1 }}</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {{ formatCurrency(modelDetails.dcf.projectedRevenue[index] ?? 0) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {{ formatCurrency(fcf) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Calculation Steps -->
            <div>
              <h3 class="text-lg font-semibold text-black mb-3">Calculation Steps</h3>
              <ol class="space-y-2">
                <li v-for="(step, index) in modelDetails.dcf.detailedSteps" :key="index" class="flex">
                  <span class="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mr-3">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700">{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- DDM Model Details -->
          <div v-if="modelDetails.ddm.applicable" class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-2xl font-bold text-black mb-4">Dividend Discount Model (DDM)</h2>
            
            <!-- Assumptions -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Key Assumptions</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Dividend Growth Rate</div>
                  <div class="text-xl font-bold text-black">
                    {{ (modelDetails.ddm.assumptions.dividendGrowthRate * 100).toFixed(2) }}%
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Discount Rate</div>
                  <div class="text-xl font-bold text-black">
                    {{ (modelDetails.ddm.assumptions.discountRate * 100).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Historical Dividends -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Historical Dividends</h3>
              <div class="flex space-x-4 overflow-x-auto">
                <div v-for="(dividend, index) in modelDetails.ddm.historicalDividends" :key="index" class="bg-gray-50 p-4 rounded-lg min-w-[120px]">
                  <div class="text-sm text-gray-600">Year {{ index + 1 }}</div>
                  <div class="text-lg font-bold text-black">
                    {{ formatCurrency(dividend) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Calculation Steps -->
            <div>
              <h3 class="text-lg font-semibold text-black mb-3">Calculation Steps</h3>
              <ol class="space-y-2">
                <li v-for="(step, index) in modelDetails.ddm.detailedSteps" :key="index" class="flex">
                  <span class="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mr-3">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700">{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- Relative Valuation Details -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-2xl font-bold text-black mb-4">Relative Valuation (Peer Comparison)</h2>
            
            <!-- Peer Comparisons -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Industry Peers</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/E Ratio</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/B Ratio</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/S Ratio</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="peer in modelDetails.relativeValue.peerComparisons" :key="peer.ticker">
                      <td class="px-4 py-3 text-sm">
                        <div class="font-medium text-gray-900">{{ peer.ticker }}</div>
                        <div class="text-gray-500 text-xs">{{ peer.name }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ peer.pe.toFixed(2) }}</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ peer.pb.toFixed(2) }}</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">{{ peer.ps.toFixed(2) }}</td>
                    </tr>
                    <tr class="bg-gray-50 font-semibold">
                      <td class="px-4 py-3 text-sm text-gray-900">Industry Median</td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {{ modelDetails.relativeValue.industryMedians.pe.toFixed(2) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {{ modelDetails.relativeValue.industryMedians.pb.toFixed(2) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-900 text-right">
                        {{ modelDetails.relativeValue.industryMedians.ps.toFixed(2) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Calculation Steps -->
            <div>
              <h3 class="text-lg font-semibold text-black mb-3">Calculation Steps</h3>
              <ol class="space-y-2">
                <li v-for="(step, index) in modelDetails.relativeValue.detailedSteps" :key="index" class="flex">
                  <span class="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mr-3">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700">{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- Graham Number Details -->
          <div v-if="modelDetails.graham.applicable" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-bold text-black mb-4">Graham Number</h2>
            
            <!-- Assumptions -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-black mb-3">Key Inputs</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Earnings Per Share (EPS)</div>
                  <div class="text-xl font-bold text-black">
                    {{ formatCurrency(modelDetails.graham.assumptions.eps) }}
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <div class="text-sm text-gray-600">Book Value Per Share</div>
                  <div class="text-xl font-bold text-black">
                    {{ formatCurrency(modelDetails.graham.assumptions.bookValuePerShare) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Calculation Steps -->
            <div>
              <h3 class="text-lg font-semibold text-black mb-3">Calculation Steps</h3>
              <ol class="space-y-2">
                <li v-for="(step, index) in modelDetails.graham.detailedSteps" :key="index" class="flex">
                  <span class="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mr-3">
                    {{ index + 1 }}
                  </span>
                  <span class="text-gray-700">{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

const route = useRoute();
const { isAuthenticated, isPro, user, logout } = useAuth();
const {
  modelDetails,
  modelDetailsLoading,
  modelDetailsError,
  getModelDetails,
} = useStockData();

const ticker = computed(() => route.params.ticker as string);

// Load model details on mount (only for Pro users)
const loadModelDetails = async () => {
  if (isPro.value) {
    await getModelDetails(ticker.value);
  }
};

onMounted(() => {
  loadModelDetails();
});

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const handleLogout = async () => {
  await logout();
};
</script>
