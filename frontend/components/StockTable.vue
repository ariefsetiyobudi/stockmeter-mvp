<template>
  <div class="stock-table-container">
    <!-- Table wrapper for horizontal scroll on mobile -->
    <div class="overflow-x-auto">
      <table class="stock-table">
        <thead>
          <tr>
            <th @click="sortBy('ticker')" class="sortable">
              Ticker
              <span v-if="sortColumn === 'ticker'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('name')" class="sortable">
              Name
              <span v-if="sortColumn === 'name'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('price')" class="sortable">
              Price
              <span v-if="sortColumn === 'price'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('dcf')" class="sortable">
              DCF
              <span v-if="sortColumn === 'dcf'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('ddm')" class="sortable">
              DDM
              <span v-if="sortColumn === 'ddm'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('pe')" class="sortable">
              P/E
              <span v-if="sortColumn === 'pe'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('graham')" class="sortable">
              Graham
              <span v-if="sortColumn === 'graham'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('status')" class="sortable">
              Status
              <span v-if="sortColumn === 'status'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th v-if="showActions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in sortedStocks" :key="stock.ticker">
            <td class="ticker-cell">
              <NuxtLink :to="`/stocks/${stock.ticker}`" class="ticker-link">
                {{ stock.ticker }}
              </NuxtLink>
            </td>
            <td class="name-cell">{{ stock.name }}</td>
            <td class="price-cell">{{ formatCurrency(stock.price) }}</td>
            <td class="fair-value-cell">{{ formatCurrency(stock.dcf) }}</td>
            <td class="fair-value-cell">{{ formatValue(stock.ddm) }}</td>
            <td class="fair-value-cell">{{ formatCurrency(stock.pe) }}</td>
            <td class="fair-value-cell">{{ formatValue(stock.graham) }}</td>
            <td class="status-cell">
              <span :class="['status-badge', getStatusClass(stock.status)]">
                {{ formatStatus(stock.status) }}
              </span>
            </td>
            <td v-if="showActions" class="actions-cell">
              <slot name="actions" :stock="stock"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && totalPages > 1" class="pagination">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        Previous
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface StockTableRow {
  ticker: string;
  name: string;
  price: number;
  dcf: number;
  ddm: number | null;
  pe: number;
  graham: number | null;
  status: 'undervalued' | 'fairly_priced' | 'overvalued';
}

interface Props {
  stocks: StockTableRow[];
  showActions?: boolean;
  itemsPerPage?: number;
  showPagination?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  itemsPerPage: 10,
  showPagination: true,
});

// Sorting state
const sortColumn = ref<keyof StockTableRow>('ticker');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Pagination state
const currentPage = ref(1);

// Computed: sorted stocks
const sortedStocks = computed(() => {
  const sorted = [...props.stocks].sort((a, b) => {
    const aVal = a[sortColumn.value];
    const bVal = b[sortColumn.value];

    // Handle null values
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  // Apply pagination
  if (props.showPagination) {
    const start = (currentPage.value - 1) * props.itemsPerPage;
    const end = start + props.itemsPerPage;
    return sorted.slice(start, end);
  }

  return sorted;
});

// Computed: total pages
const totalPages = computed(() => {
  return Math.ceil(props.stocks.length / props.itemsPerPage);
});

// Methods
const sortBy = (column: keyof StockTableRow) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
  currentPage.value = 1; // Reset to first page on sort
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatValue = (value: number | null): string => {
  if (value === null) return 'N/A';
  return formatCurrency(value);
};

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    undervalued: 'Undervalued',
    fairly_priced: 'Fair',
    overvalued: 'Overvalued',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status: string): string => {
  const classMap: Record<string, string> = {
    undervalued: 'status-undervalued',
    fairly_priced: 'status-fair',
    overvalued: 'status-overvalued',
  };
  return classMap[status] || '';
};
</script>

<style scoped>
.stock-table-container {
  width: 100%;
  margin: 1rem 0;
}

.overflow-x-auto {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stock-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.stock-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  white-space: nowrap;
}

.stock-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.stock-table th.sortable:hover {
  background: #f3f4f6;
}

.sort-indicator {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.stock-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #1f2937;
}

.stock-table tbody tr:hover {
  background: #f9fafb;
}

.ticker-cell {
  font-weight: 600;
}

.ticker-link {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.2s;
}

.ticker-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.name-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-cell,
.fair-value-cell {
  font-family: 'Courier New', monospace;
  text-align: right;
}

.status-cell {
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-undervalued {
  background: #d1fae5;
  color: #065f46;
}

.status-fair {
  background: #f3f4f6;
  color: #374151;
}

.status-overvalued {
  background: #fee2e2;
  color: #991b1b;
}

.actions-cell {
  text-align: center;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.pagination-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .stock-table th,
  .stock-table td {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .name-cell {
    max-width: 120px;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }

  .pagination-btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .stock-table th,
  .stock-table td {
    padding: 0.375rem;
    font-size: 0.7rem;
  }

  .status-badge {
    padding: 0.125rem 0.5rem;
    font-size: 0.625rem;
  }
}
</style>
