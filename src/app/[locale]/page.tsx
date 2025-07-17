import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t('welcome')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('features.title')}</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>{t('features.multilingual')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>{t('features.userFriendly')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>{t('features.efficient')}</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('about.title')}</h2>
          <p className="mb-4">{t('about.description')}</p>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
            {t('about.learnMore')}
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{t('currentLanguage')}</h2>
        <p className="text-muted-foreground">{t('languageNote')}</p>
      </div>
    </div>
  );
}
