import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TiTaTo - Mobile Game",
  description: "A fun, mobile-friendly TiTaTo game for two players. Play against a friend with touch-friendly controls and score tracking.",
  keywords: ["TiTaTo", "Tic Tac Toe", "Game", "Mobile", "Two Player", "React", "Next.js"],
  authors: [{ name: "Z.ai Team" }],
  manifest: "/manifest.json",
  themeColor: "#8b5cf6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "TiTaTo - Mobile Game",
    description: "A fun, mobile-friendly TiTaTo game for two players",
    type: "website",
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TiTaTo - Mobile Game",
    description: "A fun, mobile-friendly TiTaTo game for two players",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
