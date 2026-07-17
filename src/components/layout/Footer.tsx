import Link from 'next/link';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/docs', label: 'Documentation' },
  { href: 'https://github.com/armchain', label: 'GitHub', external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-neutral-50 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Brand & Links */}
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold text-neutral-900">Armchain</p>
            <nav className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  {...(link.external && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Copyright */}
          <p className="text-sm text-neutral-500">
            © 2026 Armchain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
