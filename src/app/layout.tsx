import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Armchain Bounty Board | Cryptographic Research Challenges',
  description:
    'A platform for cryptographers and security researchers to solve challenges, earn rewards, and contribute to post-quantum cryptography research.',
  keywords: [
    'cryptography',
    'bounty',
    'PQC',
    'post-quantum',
    'blockchain',
    'research',
    'ML-DSA',
    'CRYSTALS',
    'security',
  ],
  authors: [{ name: 'Armchain' }],
  openGraph: {
    title: 'Armchain Bounty Board',
    description: 'Solve cryptographic challenges. Earn rewards.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.className} min-h-screen flex flex-col bg-white`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
