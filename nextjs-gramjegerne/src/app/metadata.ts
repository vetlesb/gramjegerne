// src/app/metadata.ts
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Gramjegerne',
  description: 'For your next trip',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // iOS specific viewport settings for full screen
    viewportFit: 'cover',
  },
};
