"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ToastProvider } from "@/components/ui/toast";
import { BackendStatusProvider } from "@/components/backend-status-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BackendStatusProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>{children}</ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BackendStatusProvider>
  );
}
