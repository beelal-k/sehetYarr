'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { RxDBProvider } from '@/lib/offline/provider';
import { I18nProvider } from '@/providers/i18n-provider';
import { SyncProvider } from '@/providers/sync-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  // we need the resolvedTheme value to set the baseTheme for clerk based on the dark or light theme
  const { resolvedTheme } = useTheme();

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <ClerkProvider
          appearance={{
            baseTheme: resolvedTheme === 'dark' ? dark : undefined
          }}
        >
          <RxDBProvider>
            <I18nProvider>
              <SyncProvider>
                {children}
              </SyncProvider>
            </I18nProvider>
          </RxDBProvider>
        </ClerkProvider>
      </ActiveThemeProvider>
    </>
  );
}
