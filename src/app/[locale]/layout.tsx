// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getMessages } from "next-intl/server";
import { redirect } from "next/navigation";
import { locales, defaultLocale } from "@/i18n";
import { Header } from "@/components/header";
import { Providers } from "@/providers";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  icons: {
    icon: "https://www.myanmaronlinetechnology.com/wp-content/uploads/2022/09/mot-1.png",
    shortcut:
      "https://www.myanmaronlinetechnology.com/wp-content/uploads/2022/09/mot-1.png",
    apple:
      "https://www.myanmaronlinetechnology.com/wp-content/uploads/2022/09/mot-1.png",
  },
};

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Root layout wraps every page with the i18n provider and fonts
export default async function RootLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const { locale } = params;

  // Redirect if unsupported locale
  if (!locales.includes(locale as any)) {
    redirect(`/${defaultLocale}`);
  }

  // Load translated message bundle for the current locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <Providers locale={locale} messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
