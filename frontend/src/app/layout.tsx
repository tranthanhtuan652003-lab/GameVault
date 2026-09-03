import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CartSheet } from "@/components/cart/cart-sheet";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GameVault — Cửa hàng game số",
    template: "%s · GameVault",
  },
  description:
    "GameVault là cửa hàng game số với kho game phong phú, đánh giá cộng đồng, giỏ hàng và thanh toán an toàn.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <CartSheet />
        </Providers>
      </body>
    </html>
  );
}
