import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { GlobalHeader } from "@/components/layout/global-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Kannan Pyro Park | Premium Sivakasi Fireworks Online',
  description: 'Buy premium quality fireworks online from Kannan Pyro Park. Direct from Sivakasi. Safest crackers, best prices, and quick offline delivery coordination.',
  keywords: ['Kannan pyro park', 'Sivakasi crackers', 'buy fireworks online', 'crackers online Sivakasi', 'fireworks wholesale'],
  openGraph: {
    title: 'Kannan Pyro Park - Sivakasi Fireworks',
    description: 'Official store for premium quality fireworks and crackers.',
    url: 'https://www.kannanpyropark.in',
    siteName: 'Kannan Pyro Park',
    images: [
      {
        url: '/assests/logo.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalHeader />
        <CartDrawer />
        {children}
      </body>
    </html>
  );
}
