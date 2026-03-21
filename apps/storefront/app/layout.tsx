import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { CartProvider } from "./components/cart-provider";
import { fetchStorefrontBundle } from "./lib/storefront";
import { getSiteMetaDescription, getSiteMetaTitle, getThemeColor } from "./lib/catalog";
import "./globals.css";

export const dynamic = 'force-dynamic';

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export async function generateViewport(): Promise<Viewport> {
  const bundle = await fetchStorefrontBundle();

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: getThemeColor(bundle),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await fetchStorefrontBundle();

  return {
    title: getSiteMetaTitle(bundle),
    description: getSiteMetaDescription(bundle),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
