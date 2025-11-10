<template>
  <div class="compare-page">
    <div class="container">
      <h1 class="page-title">Stock Comparison</h1>
      <p class="page-description">
        Compare multiple stocks side-by-side to evaluate investment opportunities
      </p>

      <!-- Add Stock Section -->
      <div class="add-stock-section">
        <div class="search-wrapper">
          <StockSearchBar
            @select="handleStockSelect"
            placeholder="Search and add stocks to compare..."
          />
        </div>
        <div class="stock-limit-info">
          <span v-if="!isPro" class="limit-text">
            Free users: Limited to 1 stock. 
            <NuxtLink to="/pricing" class="upgrade-link">Upgrade to Pro</NuxtLink> 
            to compare up to 50 stocks.
          </span>
          <span v-else class="limit-text">
            {{ selectedTickers.length }} / 50 stocks selected
          </span>
        </div>
      </div>

      <!-- Selected Stocks Pills -->
      <div v-if="selectedTickers.length > 0" class="selected-stocks">
        <div class="stock-pill" v-for="ticker in selectedTickers" :key="ticker">
          <span>{{ ticker }}</span>
          <button @click="removeStock(ticker)" class="remove-btn" aria-label="Remove stock">
            ×
          </button>
        </div>
      </div>

      <!-- Upgrade Prompt for Free Users -->
      <div v-if="!isPro && selectedTickers.length >= 1" class="upgrade-prompt">
        <div class="upgrade-content">
          <h3>Unlock Batch Comparison</h3>
          <p>Upgrade to Pro to compare up to 50 stocks simultaneously and export results.</p>
          <NuxtLink to="/pricing" class="upgrade-btn">
            Upgrade to Pro
          </NuxtLink>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading comparison data...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="loadComparison" class="retry-btn">Retry</button>
      </div>

      <!-- Comparison Table -->
      <div v-if="!loading && !error && comparisonData.length > 0" class="comparison-section">
        <div class="comparison-header">
          <h2>Comparison Results</h2>
          <button
            v-if="isPro"
            @click="handleExport"
            class="export-btn"
            :disabled="exportLoading"
          >
            {{ exportLoading ? 'Exporting...' : 'Export Results' }}
          </button>
        </div>

        <StockTable
          :stocks="comparisonData"
          :show-actions="true"
          :show-pagination="comparisonData.length > 10"
        >
          <template #actions="{ stock }">
            <button @click="removeStock(stock.ticker)" class="action-remove-btn">
              Remove
            </button>
          </template>
        </StockTable>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && selectedTickers.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3>No stocks selected</h3>
        <p>Search and add stocks above to start comparing</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { StockSearchResult, FairValueResult } from '~/types';
import type { StockTableRow } from '~/components/StockTable.vue';

definePageMeta({
  middleware: 'auth',
});

const { isPro } = useAuth();
const config = useRuntimeConfig();
const authStore = useAuthStore();

// State
const selectedTickers = ref<string[]>([]);
const comparisonData = ref<StockTableRow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const exportLoading = ref(false);

// Methods
const handleStockSelect = (stock: StockSearchResult) => {
  // Check if already selected
  if (selectedTickers.value.includes(stock.ticker)) {
    return;
  }

  // Check tier limitations
  if (!isPro.value && selectedTickers.value.length >= 1) {
    error.value = 'Free users can only compare 1 stock. Upgrade to Pro for batch comparison.';
    return;
  }

  if (isPro.value && selectedTickers.value.length >= 50) {
    error.value = 'Maximum 50 stocks can be compared at once.';
    return;
  }

  // Add ticker
  selectedTickers.value.push(stock.ticker);
  error.value = null;

  // Load comparison data
  loadComparison();
};

const removeStock = (ticker: string) => {
  selectedTickers.value = selectedTickers.value.filter(t => t !== ticker);
  comparisonData.value = comparisonData.value.filter(s => s.ticker !== ticker);
  error.value = null;
};

const loadComparison = async () => {
  if (selectedTickers.value.length === 0) {
    comparisonData.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const headers: Record<string, string> = {};
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    const response = await $fetch<{ comparisons: FairValueResult[] }>('/api/stocks/compare', {
      baseURL: config.public.apiBaseUrl,
      method: 'POST',
      headers,
      body: {
        tickers: selectedTickers.value,
      },
    });

    // Transform to table format
    comparisonData.value = response.comparisons.map(result => ({
      ticker: result.ticker,
      name: result.ticker, // API should return name, using ticker as fallback
      price: result.currentPrice,
      dcf: result.dcf.fairValue,
      ddm: result.ddm.fairValue,
      pe: result.relativeValue.peRatioFairValue,
      graham: result.graham.fairValue,
      status: result.valuationStatus,
    }));
  } catch (err: any) {
    console.error('Comparison error:', err);
    error.value = err.data?.error?.message || 'Failed to load comparison data';
    comparisonData.value = [];
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  if (!isPro.value) {
    error.value = 'Export is only available for Pro users';
    return;
  }

  exportLoading.value = true;
  error.value = null;

  try {
    const headers: Record<string, string> = {};
    if (authStore.accessToken) {
      headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    // Export as CSV
    const blob = await $fetch<Blob>('/api/download', {
      baseURL: config.public.apiBaseUrl,
      method: 'GET',
      headers,
      params: {
        format: 'csv',
        tickers: selectedTickers.value.join(','),
      },
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-comparison-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Export error:', err);
    error.value = err.data?.error?.message || 'Failed to export data';
  } finally {
    exportLoading.value = false;
  }
};
</script>

<style scoped>
.compare-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
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
  margin-bottom: 2rem;
}

.add-stock-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.search-wrapper {
  margin-bottom: 1rem;
}

.stock-limit-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.limit-text {
  display: block;
}

.upgrade-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.upgrade-link:hover {
  text-decoration: underline;
}

.selected-stocks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: #1e40af;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background: #dbeafe;
}

.upgrade-prompt {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
}

.upgrade-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.upgrade-content p {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.upgrade-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: white;
  color: #667eea;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
}

.loading-state {
  text-align: center;
  padding: 3rem;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 2rem;
  background: #fee2e2;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.error-message {
  color: #991b1b;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #b91c1c;
}

.comparison-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.comparison-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.export-btn {
  padding: 0.5rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
}

.export-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.action-remove-btn {
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

.action-remove-btn:hover {
  background: #dc2626;
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
  .compare-page {
    padding: 1rem 0.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .comparison-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .export-btn {
    width: 100%;
  }
}
</style>
