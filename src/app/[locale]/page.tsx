// src/app/[locale]/page.tsx
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { locales, defaultLocale, type Locale } from "@/i18n";

type Props = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function Home({ params }: Props) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  if (!locales.includes(locale)) {
    redirect(`/${defaultLocale}`);
  }

  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t("welcome")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t("features.title")}</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>{t("features.multilingual")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>{t("features.userFriendly")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
