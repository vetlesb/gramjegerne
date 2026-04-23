'use client';

import {useSession, signOut} from 'next-auth/react';
import {useTheme} from '@/components/ThemeProvider';
import {useLanguage} from '@/i18n/LanguageProvider';
import {Icon} from '@/components/Icon';
import {Button} from '@/components/Button/Button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
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

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({open, onOpenChange}: SettingsDialogProps) {
  const {data: session} = useSession();
  const {theme, setTheme} = useTheme();
  const {language, setLanguage, currency, setCurrency, t} = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl text-accent font-normal pb-4">{t.settings.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Account */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">{t.settings.account}</h2>
            <div className="flex items-center justify-between bg-primary rounded-lg p-4">
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
                    language === lang.value ? 'bg-accent text-secondary' : 'bg-primary menu-item'
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
                    theme === opt.value ? 'bg-accent text-secondary' : 'bg-primary menu-item'
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
                    currency === cur.value ? 'bg-accent text-secondary' : 'bg-primary menu-item'
                  }`}
                >
                  {cur.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
