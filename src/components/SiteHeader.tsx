'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Menu, X, ArrowLeft, Search, Heart, Bell } from 'lucide-react';

interface SiteHeaderProps {
  variant?: 'default' | 'transparent';
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
  showSearch?: boolean;
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
  showSearch = true,
}: SiteHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const isActive = (href: string) => pathname === href;
  
  // Don't show back button on homepage
  const showBackButton = pathname !== '/';
  
  // Hide inline search on search page and homepage
  const shouldShowSearch = showSearch && pathname !== '/search' && pathname !== '/';
  
  // BUYER AUDIT: Fetch watchlist and notification counts
  const fetchCounts = useCallback(async () => {
    if (!session?.user) return;
    try {
      const [watchlistRes, notifRes] = await Promise.all([
        fetch('/api/watchlist?countOnly=true'),
        fetch('/api/notifications?unreadOnly=true&countOnly=true'),
      ]);
      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setWatchlistCount(data.count || 0);
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotificationCount(data.count || 0);
      }
    } catch {
      // Silently fail - counts are nice-to-have
    }
  }, [session?.user]);
  
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          <div className="hidden md:flex items-center gap-8">
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
          
          {/* BUYER AUDIT: Search Bar */}
          {shouldShowSearch && (
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] xl:w-[260px] h-9 pl-9 pr-3 text-sm bg-slate-100 border-0 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rail-orange/30 focus:bg-white transition-all"
                />
              </div>
            </form>
          )}

          {/* Auth/CTA Buttons */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                {/* BUYER AUDIT: Watchlist Icon with Count */}
                <Link
                  href="/dashboard/watchlist"
                  className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rail-orange transition-colors"
                  title="My Watchlist"
                >
                  <Heart className="w-[18px] h-[18px]" />
                  {watchlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rail-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {watchlistCount > 99 ? '99+' : watchlistCount}
                    </span>
                  )}
                </Link>
                
                {/* BUYER AUDIT: Notification Bell with Count */}
                <Link
                  href="/dashboard/notifications"
                  className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rail-orange transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
                
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

        {/* Mobile Navigation - Slide In */}
        <div 
          className={`md:hidden fixed inset-0 top-[72px] bg-black/50 z-40 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div 
          className={`md:hidden fixed top-[72px] right-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3.5 rounded-xl text-[15px] font-medium transition-colors min-h-[48px] flex items-center ${
                    isActive(link.href)
                      ? 'bg-rail-orange/10 text-rail-orange'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 mt-3 pt-3">
                {session?.user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-[15px] font-medium text-navy-900 hover:bg-slate-50 min-h-[48px] flex items-center"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3.5 rounded-xl text-[15px] font-medium text-slate-600 hover:bg-slate-50 min-h-[48px]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3.5 mt-2 rounded-xl text-[15px] font-semibold bg-rail-orange text-white text-center min-h-[48px] flex items-center justify-center"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
