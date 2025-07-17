import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { locales } from '@/i18n';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Management System",
  description: "HR Management System with Myanmar and English support",
};

import { Header } from "@/components/header";
import { Providers } from "@/providers";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({
  children,
  params: { locale },
}: Props) {
  // Use default locale if the requested locale is not supported
  const currentLocale = locales.includes(locale as any) ? locale : 'en';
  
  // Get messages for the current locale
  const messages = await getMessages({ locale: currentLocale });

  return (
    <html lang={currentLocale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers locale={currentLocale} messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale: locale as string,
  }));
}
