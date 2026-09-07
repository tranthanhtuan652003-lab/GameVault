"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartDto } from "./types";
import { api, ApiError } from "./api";
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

const GUEST_CART_KEY = "gamevault_guest_cart";

function emptyCart(): CartDto {
  return { id: 0, items: [], subtotal: 0, totalDiscount: 0, total: 0 };
}

function loadGuestCart(): CartDto {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as CartDto;
    return parsed && Array.isArray(parsed.items) ? parsed : emptyCart();
  } catch {
    return emptyCart();
  }
}

function saveGuestCart(cart: CartDto) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
}

function recomputeCart(cart: CartDto): CartDto {
  const items = cart.items.map((i) => ({
    ...i,
    lineTotal: (i.discountPrice ?? i.unitPrice ?? 0) * i.quantity,
  }));
  const subtotal = items.reduce((a, i) => a + (i.unitPrice ?? 0) * i.quantity, 0);
  const totalDiscount = items.reduce(
    (a, i) => a + ((i.unitPrice ?? 0) - (i.discountPrice ?? i.unitPrice ?? 0)) * i.quantity,
    0
  );
  return {
    ...cart,
    items,
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartDto | null>(null);
  const [loading, setLoading] = useState(true);
  // latest-wins guard: response cũ không được ghi đè response mới
  const cartSeq = useRef(0);
  const guestCartRef = useRef<CartDto | null>(null);

  const loadServerCart = useCallback(async (t: string) => {
    const seq = ++cartSeq.current;
    try {
      const c = await api.cart.get(t);
      if (seq === cartSeq.current) setCart(c);
    } catch {
      if (seq === cartSeq.current) setCart(null);
    } finally {
      if (seq === cartSeq.current) setLoading(false);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      // Chưa đăng nhập: hiển thị guest cart đã lưu (không reset mất)
      const g = guestCartRef.current ?? loadGuestCart();
      guestCartRef.current = g;
      setCart(g);
      setLoading(false);
      return;
    }
    setLoading(true);
    await loadServerCart(token);
  }, [token, isAuthenticated, loadServerCart]);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      const g = guestCartRef.current ?? loadGuestCart();
      guestCartRef.current = g;
      setCart(g);
      setLoading(false);
      return;
    }
    loadServerCart(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  // Merge guest cart vào server cart ngay sau khi đăng nhập thành công
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    const g = guestCartRef.current ?? loadGuestCart();
    if (!g || g.items.length === 0) return;
    (async () => {
      try {
        for (const item of g.items) {
          try {
            await api.cart.add(item.gameId, item.quantity, token);
          } catch (err) {
            // Bỏ qua item không thêm được (game bị xóa/inactive) để không chặn merge
            if (err instanceof ApiError && err.status === 404) continue;
          }
        }
      } finally {
        localStorage.removeItem(GUEST_CART_KEY);
        guestCartRef.current = emptyCart();
        await refreshCart();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  const count = useMemo(
    () => cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0,
    [cart]
  );

  const addToCart = useCallback(
    async (gameId: number, quantity = 1) => {
      if (!token || !isAuthenticated) {
        // Guest cart: cần dữ liệu game để hiển thị đủ trong sheet
        const game = await api.games.byId(gameId);
        const current = guestCartRef.current ?? loadGuestCart();
        const existing = current.items.find((i) => i.gameId === gameId);
        let items = current.items;
        if (existing) {
          items = current.items.map((i) =>
            i.gameId === gameId ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i
          );
        } else {
          const unitPrice = game.price;
          const discountPrice = game.discountPrice;
          items = [
            ...current.items,
            {
              id: -gameId,
              gameId,
              gameTitle: game.title,
              gameSlug: game.slug,
              coverImage: game.coverImage,
              quantity: Math.min(10, quantity),
              unitPrice,
              discountPrice,
              lineTotal: (discountPrice ?? unitPrice) * quantity,
            },
          ];
        }
        const next = recomputeCart({ ...current, items });
        guestCartRef.current = next;
        saveGuestCart(next);
        setCart(next);
        return;
      }
      try {
        await api.cart.add(gameId, quantity, token);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) throw err;
      }
      await refreshCart();
    },
    [token, isAuthenticated, refreshCart]
  );

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (!token || !isAuthenticated) {
        const current = guestCartRef.current ?? loadGuestCart();
        const next = recomputeCart({
          ...current,
          items: current.items
            .map((i) => (i.id === itemId ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        });
        guestCartRef.current = next;
        saveGuestCart(next);
        setCart(next);
        return;
      }
      await api.cart.update(itemId, quantity, token);
      await refreshCart();
    },
    [token, isAuthenticated, refreshCart]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!token || !isAuthenticated) {
        const current = guestCartRef.current ?? loadGuestCart();
        const next = recomputeCart({
          ...current,
          items: current.items.filter((i) => i.id !== itemId),
        });
        guestCartRef.current = next;
        saveGuestCart(next);
        setCart(next);
        return;
      }
      await api.cart.remove(itemId, token);
      await refreshCart();
    },
    [token, isAuthenticated, refreshCart]
  );

  const clearCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      const next = emptyCart();
      guestCartRef.current = next;
      saveGuestCart(next);
      setCart(next);
      return;
    }
    await api.cart.clear(token);
    await refreshCart();
  }, [token, isAuthenticated, refreshCart]);

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