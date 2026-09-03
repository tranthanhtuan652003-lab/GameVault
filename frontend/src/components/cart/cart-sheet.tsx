"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, Plus, Minus, Trash, ArrowRight } from "@phosphor-icons/react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CartSheet() {
  const {
    cart,
    count,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating trigger on mobile */}
      {count > 0 && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex h-12 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-gray-950 shadow-xl md:hidden"
        >
          Giỏ hàng ({count})
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-edge bg-surface"
            >
              <div className="flex items-center justify-between border-b border-edge px-5 py-4">
                <h2 className="text-lg font-bold text-ink">
                  Giỏ hàng{" "}
                  <span className="text-sm font-normal text-ink-soft">
                    ({count} sản phẩm)
                  </span>
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {cart?.items.length ? (
                  <ul className="space-y-4">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                          <Image
                            src={item.coverImage}
                            alt={item.gameTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/games/${item.id}`}
                              className="text-sm font-medium text-ink line-clamp-2 hover:text-accent"
                            >
                              {item.gameTitle}
                            </Link>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-ink-soft hover:text-danger"
                              aria-label="Xóa"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-lg border border-edge">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, Math.max(1, item.quantity - 1))
                                }
                                className="p-1.5 text-ink-soft hover:text-ink"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, Math.min(10, item.quantity + 1))
                                }
                                className="p-1.5 text-ink-soft hover:text-ink"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-accent">
                              {formatPrice(item.lineTotal)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-ink-soft">Giỏ hàng trống</p>
                    <Link
                      href="/games"
                      onClick={() => setOpen(false)}
                      className="mt-4 text-sm font-semibold text-accent hover:underline"
                    >
                      Khám phá game ngay
                    </Link>
                  </div>
                )}
              </div>

              {cart?.items.length ? (
                <div className="border-t border-edge px-5 py-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-ink-soft">Tạm tính</span>
                    <span className="text-ink">{formatPrice(cart.subtotal)}</span>
                  </div>
                  {cart.totalDiscount > 0 && (
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-ink-soft">Giảm giá</span>
                      <span className="text-accent">
                        -{formatPrice(cart.totalDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="mb-4 flex justify-between border-t border-edge pt-3">
                    <span className="font-semibold text-ink">Tổng</span>
                    <span className="text-lg font-bold text-accent">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                  <Link href="/checkout" onClick={() => setOpen(false)}>
                    <Button className="w-full" size="lg">
                      Thanh toán <ArrowRight size={18} />
                    </Button>
                  </Link>
                  <button
                    onClick={clearCart}
                    className="mt-2 w-full text-center text-xs text-ink-soft hover:text-danger"
                  >
                    Xóa toàn bộ giỏ hàng
                  </button>
                </div>
              ) : null}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
