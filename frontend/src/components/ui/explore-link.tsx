"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

export function ExploreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1.5 text-sm font-semibold text-accent transition hover:text-accent-strong"
    >
      {label}
      <ArrowRight
        size={16}
        className="transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
