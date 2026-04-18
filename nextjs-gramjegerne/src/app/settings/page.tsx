'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {useSession, signOut} from 'next-auth/react';
import {useTheme} from '@/components/ThemeProvider';
import {Icon} from '@/components/Icon';
import {Button} from '@/components/Button/Button';
import Image from 'next/image';

const themes = [
  {value: 'green', label: 'Forrest', icon: 'tree'},
  {value: 'blue', label: 'Ocean', icon: 'water'},
  {value: 'yellow', label: 'Spring', icon: 'leaf'},
  {value: 'rock', label: 'Rock', icon: 'rock'},
] as const;

export default function SettingsPage() {
  const {data: session} = useSession();
  const {theme, setTheme} = useTheme();

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen">
        <div className="flex flex-col gap-8 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Account</h2>
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
            Sign out
          </Button>
        </div>
      </section>

      {/* Theme */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Theme</h2>
        <div className="flex flex-row gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex items-center gap-x-2 rounded-3xl p-3 px-4 text-lg ${
                theme === t.value ? 'bg-accent text-secondary' : 'bg-dimmed menu-item'
              }`}
            >
              <Icon name={t.icon} width={24} height={24} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

        </div>
      </main>
    </ProtectedRoute>
  );
}
