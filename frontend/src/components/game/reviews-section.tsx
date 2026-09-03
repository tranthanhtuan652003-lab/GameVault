"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import type { ReviewDto, ReviewsResponse } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ReviewsSection({
  gameId,
  initial,
}: {
  gameId: number;
  initial: ReviewsResponse | null;
}) {
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewDto[]>(initial?.items ?? []);
  const [stats, setStats] = useState(initial?.stats ?? null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast("Vui lòng đăng nhập", "info");
      return;
    }
    setSubmitting(true);
    setPurchaseError(false);
    try {
      await api.reviews.create(gameId, rating, comment, token);
      const fresh = await api.reviews.forGame(gameId);
      setReviews(fresh.items);
      setStats(fresh.stats);
      setComment("");
      setRating(5);
      toast("Đã gửi đánh giá");
    } catch (err) {
      const e = err instanceof ApiError ? err : { status: 0, message: "Có lỗi xảy ra" };
      if (e.status === 403) {
        setPurchaseError(true);
        toast("Bạn cần mua game này để đánh giá", "error");
      } else {
        toast(e.message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const breakdown = stats?.ratingBreakdown ?? {};
  const bars = [5, 4, 3, 2, 1];

  return (
    <Reveal className="mt-16 border-t border-edge pt-10">
      <h2 className="text-2xl font-bold text-ink">Đánh giá</h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Summary */}
        <div className="rounded-2xl border border-edge bg-surface p-6">
          <div className="flex items-center gap-4">
            <p className="text-5xl font-extrabold text-ink">
              {(stats?.averageRating ?? 0).toFixed(1)}
            </p>
            <div>
              <StarRating value={stats?.averageRating ?? 0} size={18} />
              <p className="mt-1 text-sm text-ink-soft">
                {stats?.totalReviews ?? 0} đánh giá
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {bars.map((star) => {
              const count = breakdown[String(star)] ?? 0;
              const total = stats?.totalReviews ?? 0;
              const pct = total ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8 shrink-0 text-ink-soft">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-ink-soft">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form + list */}
        <div>
          {isAuthenticated && (
            <form
              onSubmit={submit}
              className="mb-8 rounded-2xl border border-edge bg-surface p-6"
            >
              <h3 className="mb-4 font-semibold text-ink">Viết đánh giá của bạn</h3>
              <StarInput value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Chia sẻ trải nghiệm chơi game của bạn..."
                className="mt-4 w-full rounded-lg border border-edge bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
              />
              {purchaseError && (
                <p className="mt-2 text-sm text-danger">
                  Bạn cần mua game này trước khi đánh giá.
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Button type="submit" loading={submitting}>
                  Gửi đánh giá
                </Button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-edge py-12 text-center text-ink-soft">
              Chưa có đánh giá nào. Hãy là người đầu tiên!
            </div>
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl border border-edge bg-surface p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {review.userName}
                          {user?.id === review.userId && (
                            <span className="ml-2 text-xs text-accent">(bạn)</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StarRating value={review.rating} size={13} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {review.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Reveal>
  );
}

// Star input component
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} sao`}
        >
          <Star
            size={26}
            weight={(hover || value) >= star ? "fill" : "regular"}
            className={cn(
              "transition",
              (hover || value) >= star ? "text-amber-400" : "text-zinc-600"
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-ink-soft">{value} sao</span>
    </div>
  );
}
