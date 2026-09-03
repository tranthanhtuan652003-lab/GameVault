"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Heart, ShoppingCartSimple } from "@phosphor-icons/react";
import type { GameDto } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { StarRating } from "@/components/ui/star-rating";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useState } from "react";

export function GameCard({ game }: { game: GameDto }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast("Vui lòng đăng nhập để thêm vào giỏ hàng", "info");
      return;
    }
    setAdding(true);
    try {
      await addToCart(game.id, 1);
      toast("Đã thêm vào giỏ hàng");
    } catch {
      toast("Không thể thêm vào giỏ hàng", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      layout
      className="group relative flex flex-col overflow-hidden rounded-xl border border-edge soft:border-edge-soft bg-surface transition-all duration-300 hover:border-accent/40 hover:shadow-[0_16px_50px_rgba(0,0,0,0.45)]"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
    >
      <Link href={`/games/${game.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          <Image
            src={game.coverImage}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
          {game.discountPercent > 0 && (
            <span className="absolute top-3 left-3 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-gray-950">
              -{Math.round(game.discountPercent)}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-1.5">
            <StarRating value={game.rating} size={12} />
            <span className="text-xs text-ink-soft">
              {game.rating.toFixed(1)} ({game.ratingCount})
            </span>
          </div>

          <h3 className="text-sm font-semibold leading-snug text-ink line-clamp-1 group-hover:text-accent">
            {game.title}
          </h3>

          <div className="mt-auto flex items-center justify-between pt-2">
            <div className="flex flex-col">
              {game.discountPercent > 0 ? (
                <>
                  <span className="text-xs text-ink-soft line-through">
                    {formatPrice(game.price)}
                  </span>
                  <span className="text-base font-bold text-accent">
                    {formatPrice(game.finalPrice)}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-ink">
                  {formatPrice(game.price)}
                </span>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={adding}
              aria-label="Thêm vào giỏ hàng"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface-2 text-ink-soft transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <ShoppingCartSimple size={18} />
            </button>
          </div>
        </div>
      </Link>

      <WishlistButton gameId={game.id} />
    </motion.div>
  );
}

function WishlistButton({ gameId }: { gameId: number }) {
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [inWishlist, setInWishlist] = useState(false);

  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        if (!isAuthenticated || !token) {
          toast("Vui lòng đăng nhập", "info");
          return;
        }
        try {
          if (inWishlist) {
            await api.wishlist.remove(gameId, token);
            setInWishlist(false);
            toast("Đã xóa khỏi danh sách yêu thích");
          } else {
            await api.wishlist.add(gameId, token);
            setInWishlist(true);
            toast("Đã thêm vào danh sách yêu thích");
          }
        } catch {
          toast("Có lỗi xảy ra", "error");
        }
      }}
      aria-label="Yêu thích"
      className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border transition backdrop-blur ${
        inWishlist
          ? "border-accent bg-accent text-gray-950"
          : "border-white/20 bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:border-accent hover:text-accent"
      }`}
    >
      <Heart size={16} weight={inWishlist ? "fill" : "regular"} />
    </button>
  );
}
