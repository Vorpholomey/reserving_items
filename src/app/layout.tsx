import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RentShare — Аренда вещей рядом с вами",
  description: "Платформа для аренды вещей между соседями. Находите, бронируйте и сдавайте вещи в аренду.",
};

import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
    </AuthProvider>
  );
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          }
        >
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
