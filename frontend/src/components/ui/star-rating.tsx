"use client";

import { Star, StarHalf } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const normalized = Math.min(5, Math.max(0, value));
  const full = Math.floor(normalized);
  const half = normalized - full >= 0.5;
  const stars = [];

  for (let i = 0; i < full; i++) {
    stars.push(
      <Star key={i} size={size} weight="fill" className="text-amber-400" />
    );
  }
  if (half) {
    stars.push(<StarHalf key="half" size={size} weight="fill" className="text-amber-400" />);
  }
  while (stars.length < 5) {
    stars.push(
      <Star key={stars.length} size={size} className="text-zinc-600" />
    );
  }

  return <div className={cn("flex items-center gap-0.5", className)}>{stars}</div>;
}
