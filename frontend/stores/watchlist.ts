import { create } from 'zustand';

interface WatchlistItem {
  ticker: string;
  addedAt: Date;
}

interface WatchlistState {
  items: WatchlistItem[];
  watchlist: WatchlistItem[];
  isLoading: boolean;
  addItem: (ticker: string) => void;
  removeItem: (ticker: string) => void;
  hasItem: (ticker: string) => boolean;
  setItems: (items: WatchlistItem[]) => void;
  loadWatchlist: () => Promise<void>;
  removeFromWatchlist: (ticker: string) => Promise<void>;
  addToWatchlist: (ticker: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  watchlist: [],
  isLoading: false,
  addItem: (ticker) =>
    set((state) => ({
      items: [...state.items, { ticker, addedAt: new Date() }],
      watchlist: [...state.watchlist, { ticker, addedAt: new Date() }],
    })),
  removeItem: (ticker) =>
    set((state) => ({
      items: state.items.filter((item) => item.ticker !== ticker),
      watchlist: state.watchlist.filter((item) => item.ticker !== ticker),
    })),
  hasItem: (ticker) => get().items.some((item) => item.ticker === ticker),
  setItems: (items) => set({ items, watchlist: items }),
  loadWatchlist: async () => {
    set({ isLoading: true });
    // This would normally fetch from API
    // For now, just use the items already in state
    set({ isLoading: false });
  },
  removeFromWatchlist: async (ticker) => {
    get().removeItem(ticker);
  },
  addToWatchlist: async (ticker) => {
    get().addItem(ticker);
  },
}));
