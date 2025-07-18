// src/app/[locale]/page.tsx
import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { locales, defaultLocale } from "@/i18n";

type Props = {
  params: {
    locale: string;
  };
};

// This component handles the async logic
async function HomeContent({ params }: { params: { locale: string } }) {
  const locale = await params?.locale || defaultLocale;
  
  if (!locales.includes(locale as any)) {
    redirect(`/${defaultLocale}`);
  }

  const t = useTranslations("home");

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

// This is the main page component - keep it synchronous
export default function Home({ params }: Props) {
  return (
    <HomeContent params={params} />
  );
}