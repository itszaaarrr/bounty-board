'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConnectWalletButton } from '@/components/web3';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/bounties', label: 'Bounties' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-100 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-base font-semibold text-neutral-900 tracking-tight">
          Armchain
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-500 transition-colors',
                pathname === item.href
                  ? 'text-blue-600 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/bounties/create" className="hidden lg:block">
            <Button size="md" variant="primary">Create Bounty</Button>
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
