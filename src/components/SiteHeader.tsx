'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, ArrowLeft } from 'lucide-react';

interface SiteHeaderProps {
  variant?: 'default' | 'transparent';
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

const navLinks = [
  { href: '/listings', label: 'Marketplace' },
  { href: '/iso', label: 'Buyer Requests' },
  { href: '/contractors', label: 'Contractors' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
];

export default function SiteHeader({
  variant = 'default',
  showCTA = true,
  ctaText = 'List Your Equipment',
  ctaHref = '/listings/create',
}: SiteHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  
  // Don't show back button on homepage
  const showBackButton = pathname !== '/';

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors relative ${
        variant === 'transparent'
          ? 'bg-white/80 backdrop-blur-xl border-surface-border/50'
          : 'bg-white/90 backdrop-blur-2xl border-slate-100'
      }`}
    >
      <nav className="container-rail">
        <div className="flex items-center justify-between h-[72px]">
          {/* Back Button + Logo */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-navy-900 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-[22px] font-bold text-navy-900 tracking-tight">
                The Rail
              </span>
              <span className="text-[22px] font-bold text-rail-orange tracking-tight">
                Exchange
              </span>
              <span className="text-rail-orange text-[11px] font-semibold -mt-2">™</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[15px] font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-rail-orange'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth/CTA Buttons */}
          <div className="flex items-center gap-5">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex text-[15px] font-medium text-navy-900 hover:text-rail-orange transition-colors duration-200"
                >
                  Dashboard
                </Link>
                {showCTA && (
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center justify-center h-10 px-5 bg-rail-orange text-white text-[14px] font-semibold rounded-[10px] shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
                  >
                    {ctaText}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex text-[15px] font-medium text-navy-900 hover:text-rail-orange transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center h-10 px-5 bg-rail-orange text-white text-[14px] font-semibold rounded-[10px] shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-navy-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-rail-orange/10 text-rail-orange'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 mt-2 pt-2">
                {session?.user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg text-[15px] font-medium text-navy-900 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-[15px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 mt-2 rounded-lg text-[15px] font-medium bg-rail-orange text-white text-center"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
