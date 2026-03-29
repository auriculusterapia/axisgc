import type {Metadata} from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Axis GC - Sistema de Gestão de Clínica',
  description: 'Advanced clinical management for Traditional Chinese Medicine practitioners.',
};

import { AuthProvider } from '@/lib/AuthContext';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
