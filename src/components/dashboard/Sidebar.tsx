/**
 * THE RAIL EXCHANGE™ — Dashboard Sidebar Component
 * 
 * Role-based navigation sidebar with premium design.
 * Navy background with icon + label navigation items.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface SidebarProps {
  sections: NavSection[];
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, className }) => {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "w-64 bg-navy-900 min-h-screen flex flex-col",
      className
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-white">The Rail</span>
          <span className="text-lg font-bold text-rail-orange">Exchange</span>
          <span className="text-rail-orange text-xs font-semibold -mt-2">™</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-rail-orange" : "text-white/50"
                      )}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          isActive
                            ? "bg-rail-orange text-white"
                            : "bg-white/20 text-white/80"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
};

export { Sidebar };
