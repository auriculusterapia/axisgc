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
  title: 'Axis GC — Gestão Clínica Inteligente',
  description: 'Sistema de gestão completo para profissionais de saúde. Organize sua agenda, prontuários, financeiro e estoque em um só lugar com o Axis GC.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
