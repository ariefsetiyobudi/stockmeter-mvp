<template>
  <div class="watchlist-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Watchlist</h1>
          <p class="page-description">
            Monitor your favorite stocks and their valuation status
          </p>
        </div>
        <button @click="handleRefresh" class="refresh-btn" :disabled="isLoading">
          <svg class="refresh-icon" :class="{ spinning: isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Watchlist Limit Indicator -->
      <div class="limit-indicator" :class="{ 'at-limit': isAtLimit }">
        <div class="limit-content">
          <span class="limit-text">
            <template v-if="!isPro">
              {{ stockCount }} / {{ watchlistLimit }} stocks
              <span v-if="isAtLimit" class="limit-warning">
                (Limit reached)
              </span>
            </template>
            <template v-else>
              {{ stockCount }} stocks in watchlist
            </template>
          </span>
          <NuxtLink v-if="!isPro && isAtLimit" to="/pricing" class="upgrade-link-small">
            Upgrade for unlimited
          </NuxtLink>
        </div>
        <div v-if="!isPro" class="limit-bar">
          <div class="limit-progress" :style="{ width: `${(stockCount / watchlistLimit) * 100}%` }"></div>
        </div>
      </div>

      <!-- Add Stock Section -->
      <div class="add-stock-section">
        <h2 class="section-title">Add Stock to Watchlist</h2>
        <StockSearchBar
          @select="handleAddStock"
          placeholder="Search for stocks to add..."
        />
      </div>

      <!-- Upgrade Prompt for Free Users at Limit -->
      <div v-if="!isPro && isAtLimit" class="upgrade-prompt">
        <div class="upgrade-content">
          <svg class="upgrade-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h3>Watchlist Limit Reached</h3>
            <p>Upgrade to Pro for unlimited watchlist stocks and advanced features</p>
          </div>
          <NuxtLink to="/pricing" class="upgrade-btn">
            Upgrade Now
          </NuxtLink>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-banner">
        <p>{{ error }}</p>
        <button @click="clearError" class="close-btn">×</button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && stockCount === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your watchlist...</p>
      </div>

      <!-- Watchlist Table -->
      <div v-if="!isLoading && stockCount > 0" class="watchlist-section">
        <h2 class="section-title">Your Stocks</h2>
        <StockTable
          :stocks="tableData"
          :show-actions="true"
          :show-pagination="stockCount > 10"
        >
          <template #actions="{ stock }">
            <button
              @click="handleRemoveStock(stock.ticker)"
              class="remove-btn"
              :disabled="isLoading"
            >
              Remove
            </button>
          </template>
        </StockTable>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && stockCount === 0" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <h3>Your watchlist is empty</h3>
        <p>Add stocks above to start monitoring their valuation status</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import type { StockSearchResult } from '~/types';
import type { StockTableRow } from '~/components/StockTable.vue';

definePageMeta({
  middleware: 'auth',
});

const { isPro } = useAuth();
const {
  stocks,
  stockCount,
  isLoading,
  error,
  watchlistLimit,
  isAtLimit,
  loadWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  refreshWatchlist,
  clearError,
} = useWatchlist();

// Transform watchlist stocks to table format
const tableData = computed<StockTableRow[]>(() => {
  return stocks.value.map((stock: any) => ({
    ticker: stock.ticker,
    name: stock.name,
    price: stock.price,
    dcf: 0, // These would need to be fetched from fair value data
    ddm: null,
    pe: 0,
    graham: null,
    status: stock.valuationStatus,
  }));
});

// Methods
const handleAddStock = async (stock: StockSearchResult) => {
  const success = await addToWatchlist(stock.ticker);
  if (success) {
    // Show success message (could use toast notification)
    console.log(`Added ${stock.ticker} to watchlist`);
  }
};

const handleRemoveStock = async (ticker: string) => {
  if (confirm(`Remove ${ticker} from your watchlist?`)) {
    const success = await removeFromWatchlist(ticker);
    if (success) {
      console.log(`Removed ${ticker} from watchlist`);
    }
  }
};

const handleRefresh = async () => {
  await refreshWatchlist();
};

// Load watchlist on mount
onMounted(async () => {
  await loadWatchlist();
});
</script>

<style scoped>
.watchlist-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.page-description {
  font-size: 1rem;
  color: #6b7280;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.limit-indicator {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.limit-indicator.at-limit {
  background: #fef3c7;
  border: 1px solid #fbbf24;
}

.limit-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.limit-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.limit-warning {
  color: #dc2626;
  font-weight: 600;
}

.upgrade-link-small {
  font-size: 0.875rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.upgrade-link-small:hover {
  text-decoration: underline;
}

.limit-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.limit-progress {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.limit-indicator.at-limit .limit-progress {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.add-stock-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.upgrade-prompt {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.upgrade-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.upgrade-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.upgrade-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.upgrade-content p {
  font-size: 0.875rem;
  opacity: 0.9;
}

.upgrade-btn {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: white;
  color: #667eea;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.2s;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
}

.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.error-banner p {
  margin: 0;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.watchlist-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  padding: 0.25rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: #dc2626;
}

.remove-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #9ca3af;
  margin: 0 auto 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: #6b7280;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .watchlist-page {
    padding: 1rem 0.5rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .upgrade-content {
    flex-direction: column;
    text-align: center;
  }

  .upgrade-btn {
    width: 100%;
  }

  .limit-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
