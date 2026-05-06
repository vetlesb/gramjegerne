'use client';

import {useSession} from 'next-auth/react';
import {useTheme} from '@/components/ThemeProvider';
import {useLanguage} from '@/i18n/LanguageProvider';
import {useImagePrefs} from '@/components/ImagePrefsProvider';
import {useSettingsSync} from '@/hooks/useSettingsSync';

export function SettingsSync() {
  const {data: session} = useSession();
  const {setTheme} = useTheme();
  const {setLanguage, setCurrency} = useLanguage();
  const {setGearImagesEnabled, setPackingListImagesEnabled} = useImagePrefs();

  useSettingsSync(
    {
      setTheme: (t) => setTheme(t as Parameters<typeof setTheme>[0]),
      setLanguage: (l) => setLanguage(l as Parameters<typeof setLanguage>[0]),
      setCurrency: (c) => setCurrency(c as Parameters<typeof setCurrency>[0]),
      setGearImagesEnabled,
      setPackingListImagesEnabled,
    },
    !!session?.user,
  );

  return null;
}
