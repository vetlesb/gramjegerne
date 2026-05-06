'use client';

import {createContext, useContext, useCallback, useEffect, useState} from 'react';
import {saveSettingToServer} from '@/hooks/useSettingsSync';

interface ImagePrefsContextType {
  gearImagesEnabled: boolean;
  packingListImagesEnabled: boolean;
  setGearImagesEnabled: (enabled: boolean) => void;
  setPackingListImagesEnabled: (enabled: boolean) => void;
}

const ImagePrefsContext = createContext<ImagePrefsContextType | undefined>(undefined);

const readBool = (key: string, fallback: boolean): boolean => {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === 'true';
};

export function ImagePrefsProvider({children}: {children: React.ReactNode}) {
  const [gearImagesEnabled, setGearState] = useState<boolean>(true);
  const [packingListImagesEnabled, setListState] = useState<boolean>(true);

  useEffect(() => {
    setGearState(readBool('gearImagesEnabled', true));
    setListState(readBool('packingListImagesEnabled', true));
  }, []);

  const setGearImagesEnabled = useCallback((enabled: boolean) => {
    setGearState(enabled);
    localStorage.setItem('gearImagesEnabled', String(enabled));
    saveSettingToServer('gearImagesEnabled', enabled);
  }, []);

  const setPackingListImagesEnabled = useCallback((enabled: boolean) => {
    setListState(enabled);
    localStorage.setItem('packingListImagesEnabled', String(enabled));
    saveSettingToServer('packingListImagesEnabled', enabled);
  }, []);

  return (
    <ImagePrefsContext.Provider
      value={{
        gearImagesEnabled,
        packingListImagesEnabled,
        setGearImagesEnabled,
        setPackingListImagesEnabled,
      }}
    >
      {children}
    </ImagePrefsContext.Provider>
  );
}

export function useImagePrefs() {
  const ctx = useContext(ImagePrefsContext);
  if (ctx === undefined) {
    throw new Error('useImagePrefs must be used within an ImagePrefsProvider');
  }
  return ctx;
}
