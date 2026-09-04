"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartDto } from "./types";
import { api } from "./api";
import { useAuth } from "./auth";

interface CartContextValue {
  cart: CartDto | null;
  loading: boolean;
  count: number;
  refreshCart: () => Promise<void>;
  addToCart: (gameId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const c = await api.cart.get(token);
      setCart(c);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    let active = true;
    api.cart
      .get(token)
      .then((c) => {
        if (active) setCart(c);
      })
      .catch(() => {
        if (active) setCart(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, isAuthenticated]);

  const count = useMemo(
    () => cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0,
    [cart]
  );

  const addToCart = useCallback(
    async (gameId: number, quantity = 1) => {
      if (!token) throw new Error("not_authenticated");
      const c = await api.cart.add(gameId, quantity, token);
      setCart(c);
    },
    [token]
  );

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (!token) return;
      await api.cart.update(itemId, quantity, token);
      await refreshCart();
    },
    [token, refreshCart]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!token) return;
      await api.cart.remove(itemId, token);
      await refreshCart();
    },
    [token, refreshCart]
  );

  const clearCart = useCallback(async () => {
    if (!token) return;
    await api.cart.clear(token);
    setCart({ id: 0, items: [], subtotal: 0, totalDiscount: 0, total: 0 });
    await refreshCart();
  }, [token, refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      count,
      refreshCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [cart, loading, count, refreshCart, addToCart, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
