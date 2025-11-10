<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-14 sm:h-16">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-xl sm:text-2xl font-bold text-black">
              Stockmeter
            </NuxtLink>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/watchlist"
                class="hidden sm:inline-block text-gray-700 hover:text-black px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium tap-highlight-none"
              >
                Watchlist
              </NuxtLink>
              <NuxtLink
                to="/compare"
                class="hidden sm:inline-block text-gray-700 hover:text-black px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium tap-highlight-none"
              >
                Compare
              </NuxtLink>
              <span class="hidden md:inline text-gray-700 text-sm">{{ user?.name }}</span>
              <span v-if="isPro" class="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-white bg-black rounded">
                PRO
              </span>
              <button
                @click="handleLogout"
                class="text-gray-700 hover:text-black px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium tap-highlight-none"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="text-gray-700 hover:text-black px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium tap-highlight-none"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="bg-black text-white hover:bg-gray-800 active:bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium tap-highlight-none"
              >
                Sign Up
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section with Search -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20">
      <div class="text-center max-w-4xl mx-auto">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 sm:mb-6">
          Discover the True Value of Stocks
        </h1>
        <p class="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 px-4">
          Calculate fair value using multiple industry-standard valuation models. 
          Make informed investment decisions with DCF, DDM, P/E ratios, and Graham Number analysis.
        </p>

        <!-- Stock Search Bar -->
        <div class="max-w-2xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <StockSearchBar />
        </div>

        <!-- Call to Action -->
        <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <NuxtLink
            to="/register"
            class="inline-block bg-black text-white hover:bg-gray-800 active:bg-gray-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium transition-colors tap-highlight-none min-h-touch"
          >
            Get Started Free
          </NuxtLink>
          <NuxtLink
            to="/pricing"
            class="inline-block bg-white text-black border-2 border-black hover:bg-gray-50 active:bg-gray-100 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium transition-colors tap-highlight-none min-h-touch"
          >
            View Pricing
          </NuxtLink>
        </div>
      </div>

      <!-- Features Section -->
      <div class="mt-16 sm:mt-24 md:mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <div class="text-center px-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-base sm:text-lg font-semibold text-black mb-2">DCF Analysis</h3>
          <p class="text-gray-600 text-sm">
            Discounted cash flow valuation with 10-year projections
          </p>
        </div>

        <div class="text-center px-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-base sm:text-lg font-semibold text-black mb-2">Dividend Model</h3>
          <p class="text-gray-600 text-sm">
            DDM valuation for dividend-paying stocks
          </p>
        </div>

        <div class="text-center px-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-base sm:text-lg font-semibold text-black mb-2">Peer Comparison</h3>
          <p class="text-gray-600 text-sm">
            Relative valuation using industry P/E, P/B, P/S ratios
          </p>
        </div>

        <div class="text-center px-4">
          <div class="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-lg mx-auto mb-3 sm:mb-4 flex items-center justify-center">
            <svg class="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-base sm:text-lg font-semibold text-black mb-2">Graham Number</h3>
          <p class="text-gray-600 text-sm">
            Conservative value investing metric
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, isPro, user, logout } = useAuth();

const handleLogout = async () => {
  await logout();
};
</script>
