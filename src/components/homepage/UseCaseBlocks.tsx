/**
 * THE RAIL EXCHANGE™ — Use Case Blocks Component
 * 
 * Amazon holiday-style story blocks for use-case navigation.
 * 2x2 grid layout with contextual images
 */

import Link from 'next/link';

interface UseCase {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bgColor: string;
  icon: React.ReactNode;
}

const USE_CASES: UseCase[] = [
  {
    id: 'build-track',
    title: 'Build or Expand Track',
    subtitle: 'Track materials, switches, frogs, ties, and rail',
    cta: 'Shop Track Materials',
    href: '/marketplace/category/track-materials',
    bgColor: 'from-amber-600 to-orange-700',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'repair-fleet',
    title: 'Repair & Maintain Your Fleet',
    subtitle: 'Tools, welders, parts, and spike equipment',
    cta: 'Shop Tools & Parts',
    href: '/listings?category=tools-equipment',
    bgColor: 'from-slate-700 to-slate-900',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'contractors',
    title: 'Source Rail Contractors',
    subtitle: 'Verified FRA-qualified contractors for any project',
    cta: 'Find Contractors',
    href: '/contractors',
    bgColor: 'from-emerald-600 to-teal-700',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'lease',
    title: 'Lease Equipment Fast',
    subtitle: 'Railcars, hi-rails, tampers, and more available now',
    cta: 'Browse Rentals',
    href: '/listings?priceType=rental',
    bgColor: 'from-blue-600 to-indigo-700',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export function UseCaseBlocks() {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-[22px] md:text-[26px] font-bold text-navy-900 tracking-tight">
            What are you looking for?
          </h2>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {USE_CASES.map((useCase) => (
            <Link
              key={useCase.id}
              href={useCase.href}
              className={`group relative h-[160px] md:h-[200px] bg-gradient-to-r ${useCase.bgColor} rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4" />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="text-white/80 mb-3">
                    {useCase.icon}
                  </div>
                  <h3 className="text-[18px] md:text-[22px] font-bold text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-[14px] text-white/70">
                    {useCase.subtitle}
                  </p>
                </div>

                <div className="flex items-center text-white font-medium text-[14px] group-hover:translate-x-1 transition-transform">
                  {useCase.cta}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UseCaseBlocks;
