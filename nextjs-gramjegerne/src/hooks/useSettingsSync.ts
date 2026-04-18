'use client';

import {useEffect, useRef} from 'react';

/**
 * Saves a single setting to the server (fire-and-forget).
 */
export function saveSettingToServer(key: string, value: string) {
  fetch('/api/userSettings', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({[key]: value}),
  }).catch((err) => console.error(`Failed to save ${key} setting:`, err));
}

/**
 * Loads all user settings from the server and calls the provided
 * setters if the server value differs from localStorage.
 * Only fetches when `enabled` is true (user is logged in).
 */
export function useSettingsSync(
  setters: {
    setTheme: (theme: string) => void;
    setLanguage: (language: string) => void;
    setCurrency: (currency: string) => void;
  },
  enabled: boolean,
) {
  const fetched = useRef(false);

  useEffect(() => {
    if (!enabled || fetched.current) return;
    fetched.current = true;

    fetch('/api/userSettings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;

        if (data.theme && data.theme !== localStorage.getItem('theme')) {
          localStorage.setItem('theme', data.theme);
          setters.setTheme(data.theme);
        }
        if (data.language && data.language !== localStorage.getItem('language')) {
          localStorage.setItem('language', data.language);
          setters.setLanguage(data.language);
        }
        if (data.currency && data.currency !== localStorage.getItem('currency')) {
          localStorage.setItem('currency', data.currency);
          setters.setCurrency(data.currency);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
