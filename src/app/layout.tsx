import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { JotaiProvider } from '@/components/providers/jotai-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '割り勘計算',
  description: '旅行費用の割り勘を計算するアプリ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JotaiProvider>
          {children}
          <Toaster />
        </JotaiProvider>
      </body>
    </html>
  );
}
