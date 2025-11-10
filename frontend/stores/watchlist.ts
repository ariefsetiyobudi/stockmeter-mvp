import { defineStore } from 'pinia';

export interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  valuationStatus: 'undervalued' | 'fairly_priced' | 'overvalued';
  addedAt: Date;
}

interface WatchlistState {
  stocks: WatchlistStock[];
  isLoading: boolean;
  error: string | null;
}

export const useWatchlistStore = defineStore('watchlist', {
  state: (): WatchlistState => ({
    stocks: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    stockCount: (state) => state.stocks.length,
    
    hasTicker: (state) => (ticker: string) => {
      return state.stocks.some(s => s.ticker === ticker);
    },

    getByTicker: (state) => (ticker: string) => {
      return state.stocks.find(s => s.ticker === ticker);
    },
  },

  actions: {
    setStocks(stocks: WatchlistStock[]) {
      this.stocks = stocks;
    },

    addStock(stock: WatchlistStock) {
      if (!this.hasTicker(stock.ticker)) {
        this.stocks.push(stock);
      }
    },

    removeStock(ticker: string) {
      this.stocks = this.stocks.filter(s => s.ticker !== ticker);
    },

    updateStock(ticker: string, updates: Partial<WatchlistStock>) {
      const index = this.stocks.findIndex(s => s.ticker === ticker);
      if (index !== -1) {
        this.stocks[index] = { ...this.stocks[index], ...updates } as WatchlistStock;
      }
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    clearWatchlist() {
      this.stocks = [];
      this.error = null;
    },
  },
});
