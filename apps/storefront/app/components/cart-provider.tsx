'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine } from '../lib/types';

type CartContextValue = {
  items: CartLine[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartLine, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = 'wkp-storefront-cart';
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartLine[]);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage failures
    }
  }, [items]);

  const api = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      const quantity = item.quantity ?? 1;
      const key = [
        item.kind,
        item.sourceId,
        item.size || 'any',
        item.notes || '',
        JSON.stringify(item.extras || []),
      ].join('|');

      setItems((prev) => {
        const existing = prev.find((line) => line.id === key);
        if (existing) {
          return prev.map((line) =>
            line.id === key ? { ...line, quantity: line.quantity + quantity } : line
          );
        }

        return [
          ...prev,
          {
            id: key,
            quantity,
            ...item,
          },
        ];
      });
    };

    return {
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      addItem,
      removeItem: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
      setQuantity: (id, quantity) =>
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        ),
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
