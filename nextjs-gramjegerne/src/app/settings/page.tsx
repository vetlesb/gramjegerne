'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {useSession, signOut} from 'next-auth/react';
import {useTheme} from '@/components/ThemeProvider';
import {useLanguage} from '@/i18n/LanguageProvider';
import {Icon} from '@/components/Icon';
import {Button} from '@/components/Button/Button';
import Image from 'next/image';

const themeOptions = [
  {value: 'green', key: 'forrest' as const, icon: 'tree'},
  {value: 'blue', key: 'ocean' as const, icon: 'water'},
  {value: 'yellow', key: 'spring' as const, icon: 'leaf'},
  {value: 'rock', key: 'rock' as const, icon: 'rock'},
] as const;

const languages = [
  {value: 'en' as const, label: 'English'},
  {value: 'nb' as const, label: 'Norsk'},
];

const currencies = [
  {value: 'NOK' as const, label: 'NOK'},
  {value: 'SEK' as const, label: 'SEK'},
  {value: 'DKK' as const, label: 'DKK'},
  {value: 'USD' as const, label: 'USD'},
  {value: 'EUR' as const, label: 'EUR'},
];

export default function SettingsPage() {
  const {data: session} = useSession();
  const {theme, setTheme} = useTheme();
  const {language, setLanguage, currency, setCurrency, t} = useLanguage();

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen">
        <div className="flex flex-col gap-8 rounded-lg max-w-lg p-8 mx-auto bg-primary-hover">
          <h1 className="text-2xl font-bold">{t.settings.title}</h1>

      {/* Account */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t.settings.account}</h2>
        <div className="flex items-center justify-between bg-dimmed rounded-lg p-4">
          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ''}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{session?.user?.name}</span>
              <span className="text-sm">{session?.user?.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="md" onClick={() => signOut()}>
            {t.settings.signOut}
          </Button>
        </div>
      </section>

      {/* Language */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t.settings.language}</h2>
        <div className="flex flex-row gap-2 flex-wrap">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className={`flex items-center gap-x-2 rounded-3xl p-3 px-4 text-lg ${
                language === lang.value ? 'bg-accent text-secondary' : 'bg-dimmed menu-item'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>
      
   {/* Theme */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t.settings.theme}</h2>
        <div className="flex flex-row gap-2 flex-wrap">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-x-2 rounded-3xl p-3 px-4 text-lg ${
                theme === opt.value ? 'bg-accent text-secondary' : 'bg-dimmed menu-item'
              }`}
            >
              <Icon name={opt.icon} width={24} height={24} />
              {t.settings.themes[opt.key]}
            </button>
          ))}
        </div>
      </section>

      {/* Currency */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t.settings.currency}</h2>
        <div className="flex flex-row gap-2 flex-wrap">
          {currencies.map((cur) => (
            <button
              key={cur.value}
              onClick={() => setCurrency(cur.value)}
              className={`flex items-center gap-x-2 rounded-3xl p-3 px-4 text-lg ${
                currency === cur.value ? 'bg-accent text-secondary' : 'bg-dimmed menu-item'
              }`}
            >
              {cur.label}
            </button>
          ))}
        </div>
      </section>

        </div>
      </main>
    </ProtectedRoute>
  );
}
