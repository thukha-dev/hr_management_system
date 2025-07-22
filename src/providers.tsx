"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { ReactNode } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <>
      <Toaster position="top-center" richColors />
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone="Asia/Yangon"
        formats={{
          dateTime: {
            short: {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          },
        }}
      >
        <ThemeProvider
          attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
        enableColorScheme
      >
        {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}
