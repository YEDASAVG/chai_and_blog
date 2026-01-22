import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4, Lora, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { LingoProvider } from "@lingo.dev/compiler/react";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Medium-like serif font for blog content
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Alternative serif for titles
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Brand font for ChaiAndBlog logo
const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChaiAndBlog - Write, Publish, Share",
  description: "A dead-simple blogging platform for cohort students",
  icons: {
    icon: "/favicon.ico",
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
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${lora.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <LingoProvider>
          <ClerkProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ClerkProvider>
        </LingoProvider>
      </body>
    </html>
  );
}
