"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  ShoppingCartSimple,
  CalendarBlank,
  Desktop,
  User,
  BuildingOffice,
  Play,
} from "@phosphor-icons/react";
import type { GameDto, ReviewsResponse } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/format";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ReviewsSection } from "@/components/game/reviews-section";
import { cn } from "@/lib/cn";

export function GameDetailClient({
  game,
  reviews,
}: {
  game: GameDto;
  reviews: ReviewsResponse | null;
}) {
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [cartLoading, setCartLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [wished, setWished] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let cancelled = false;
    api.wishlist
      .check(game.id, token)
      .then((res) => {
        if (!cancelled) setWished(res.isInWishlist);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game.id, isAuthenticated, token]);

  const images = game.images.length ? game.images : [game.coverImage];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast("Vui lòng đăng nhập để mua game", "info");
      return;
    }
    setCartLoading(true);
    try {
      await addToCart(game.id, 1);
      toast("Đã thêm vào giỏ hàng");
    } catch {
      toast("Không thể thêm vào giỏ hàng", "error");
    } finally {
      setCartLoading(false);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated || !token) {
      toast("Vui lòng đăng nhập", "info");
      return;
    }
    setWishLoading(true);
    try {
      if (wished) {
        await api.wishlist.remove(game.id, token);
        toast("Đã xóa khỏi danh sách yêu thích");
      } else {
        await api.wishlist.add(game.id, token);
        toast("Đã thêm vào danh sách yêu thích");
      }
      setWished((v) => !v);
    } catch {
      toast("Có lỗi xảy ra", "error");
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <div className="container-page pt-8">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/games" className="hover:text-accent">
          Kho game
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{game.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Media gallery */}
        <div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-edge bg-surface-2">
            <Image
              src={images[activeImage] ?? game.coverImage}
              alt={game.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border transition",
                    i === activeImage
                      ? "border-accent"
                      : "border-edge opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <div className="flex flex-col">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {game.genres.join(", ") || "Game"}
            </span>
            <span className="text-xs text-ink-soft">
              {game.platforms.join(" · ")}
            </span>
          </div>

          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {game.title}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <StarRating value={game.rating} size={16} />
            <span className="font-semibold text-ink">
              {game.rating.toFixed(1)}
            </span>
            <span className="text-sm text-ink-soft">
              ({game.ratingCount} đánh giá)
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-edge bg-surface p-6">
            <div className="flex items-center gap-4">
              <div>
                {game.discountPercent > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-ink-soft line-through">
                      {formatPrice(game.price)}
                    </span>
                    <span className="rounded-md bg-accent/15 px-2 py-1 text-sm font-bold text-accent">
                      -{Math.round(game.discountPercent)}%
                    </span>
                  </div>
                ) : null}
                <p className="text-3xl font-extrabold text-accent">
                  {formatPrice(game.finalPrice)}
                </p>
              </div>
              <div className="ml-auto text-right text-sm text-ink-soft">
                <p>{game.salesCount} lượt bán</p>
                <p className="font-mono">{game.slug}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                size="lg"
                onClick={handleAddToCart}
                loading={cartLoading}
                className="w-full"
              >
                <ShoppingCartSimple size={20} weight="fill" />
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleWishlist}
                loading={wishLoading}
                className="w-full"
              >
                <Heart size={20} weight={wished ? "fill" : "regular"} />
                {wished ? "Trong danh sách yêu thích" : "Thêm vào yêu thích"}
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 space-y-3 text-sm">
            <MetaRow
              icon={<CalendarBlank size={16} className="text-accent" />}
              label="Ngày phát hành"
              value={formatDate(game.releaseDate)}
            />
            <MetaRow
              icon={<Desktop size={16} className="text-accent" />}
              label="Nền tảng"
              value={game.platforms.join(", ") || "N/A"}
            />
            {game.developers.length > 0 && (
              <MetaRow
                icon={<User size={16} className="text-accent" />}
                label="Nhà phát triển"
                value={game.developers.join(", ")}
              />
            )}
            {game.publishers.length > 0 && (
              <MetaRow
                icon={<BuildingOffice size={16} className="text-accent" />}
                label="Nhà phát hành"
                value={game.publishers.join(", ")}
              />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 max-w-3xl">
        <h2 className="mb-3 text-xl font-bold text-ink">Giới thiệu</h2>
        <p className="leading-relaxed text-ink-soft">{game.description}</p>
        {game.systemRequirements && (
          <>
            <h2 className="mb-3 mt-8 text-xl font-bold text-ink">
              Cấu hình yêu cầu
            </h2>
            <pre className="whitespace-pre-wrap rounded-xl border border-edge bg-surface p-5 font-mono text-sm leading-relaxed text-ink-soft">
              {game.systemRequirements}
            </pre>
          </>
        )}
      </div>

      {/* Trailer */}
      {game.trailerUrl && <TrailerSection url={game.trailerUrl} />}

      {/* Reviews */}
      <ReviewsSection gameId={game.id} initial={reviews} />
    </div>
  );
}

function TrailerSection({ url }: { url: string }) {
  const embed = getTrailerEmbed(url);
  if (!embed) {
    return (
      <div className="mt-12">
        <h2 className="mb-3 text-xl font-bold text-ink">Trailer</h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          <Play size={18} weight="fill" /> Xem trailer
        </a>
      </div>
    );
  }
  const isDirect = embed.startsWith("video:");
  return (
    <div className="mt-12">
      <h2 className="mb-3 text-xl font-bold text-ink">Trailer</h2>
      <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
        {isDirect ? (
          <video
            src={embed.slice("video:".length)}
            controls
            preload="metadata"
            className="aspect-video w-full bg-black"
          />
        ) : (
          <iframe
            src={embed}
            title={`Trailer ${url}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full border-0 bg-black"
          />
        )}
      </div>
    </div>
  );
}

function getTrailerEmbed(url: string): string | null {
  if (!url) return null;
  if (/\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url)) return `video:${url}`;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      const vid = u.searchParams.get("v");
      if (vid) return `https://www.youtube-nocookie.com/embed/${vid}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).find((s) => /^\d+$/.test(s));
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname.includes("facebook.com") && u.pathname.includes("/videos/")) return null;
  } catch {
    return null;
  }
  return null;
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2">
        {icon}
      </span>
      <span className="w-32 text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
