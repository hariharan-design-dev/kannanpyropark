// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the shape of our product data
export interface CartItem {
  id: string;
  title: string;
  price: number;
  category: string;
  quantity: number;
  unit: string;
}

// Define what actions our store can perform
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find((i) => i.id === newItem.id);
        // If it's already in the list, just increase the quantity
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            isOpen: true,
          };
        }
        // Otherwise, add it as a new item with quantity 1
        return { items: [...state.items, { ...newItem, quantity: 1 }] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: quantity <= 0 
          ? state.items.filter((i) => i.id !== id) // Remove if quantity hits 0
          : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
      })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),

      toggleCart: () => set((state) => ({isOpen: !state.isOpen})),
    }),
    {
      name: 'kannan-preorder-cart', // The name of the localStorage key
      partialize: (state) => ({ items: state.items }),
    }
  )
);