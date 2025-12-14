/**
 * THE RAIL EXCHANGE™ — Featured Listing Example Page
 * 
 * Showcase page demonstrating how featured listings appear.
 * This is a promotional/demo page, not mock data.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Elite Placement — Maximum Visibility | THE RAIL EXCHANGE™',
  description: 'Get Elite Placement for maximum visibility. Homepage features, top of search, category priority, and the most buyer exposure on The Rail Exchange™.',
};

export default function FeaturedExamplePage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border-default sticky top-0 z-50">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-lg font-bold text-navy-900">The Rail</span>
            <span className="text-lg font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-xs font-medium ml-0.5">™</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="text-sm text-text-secondary hover:text-navy-900">
              ← Back to Marketplace
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Elite Placement Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">👑 Elite Placement</h2>
              <p className="text-white/90">The highest visibility tier — homepage, search, and category priority</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button size="lg" className="bg-white text-amber-600 hover:bg-white/90 font-semibold">
              Upgrade to Elite
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Title Section */}
            <div>
              <Badge className="bg-amber-100 text-amber-700 border-0 mb-3">
                👑 Elite Placement
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-3">
                Elite Placement — Maximum Visibility for Serious Sellers
              </h1>
              <p className="text-lg text-text-secondary">
                Elite Placement is our highest visibility tier. Your listing appears on the homepage, at the top of search results, and dominates category pages.
              </p>
            </div>

            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Equipment Photos Here</h3>
                  <p className="text-white/70 max-w-md mx-auto">
                    High-resolution photos of your hi-rail trucks, locomotives, equipment, tools, rentals, or materials
                  </p>
                </div>
              </div>
              {/* Thumbnail Strip */}
              <div className="p-4 bg-surface-secondary flex gap-3 overflow-x-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-lg bg-navy-900/10 flex-shrink-0 flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-navy-900/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ))}
              </div>
            </Card>

            {/* Overview Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="text-amber-500">👑</span> Why Elite Placement?
                </h2>
                <p className="text-text-secondary mb-6">
                  Elite Placement is for sellers who want the absolute maximum exposure. This is the tier serious sellers choose.
                </p>
                
                <h3 className="font-semibold text-navy-900 mb-3">Elite listings receive:</h3>
                <ul className="space-y-2 mb-6">
                  {[
                    'Featured on the homepage',
                    'Top positioning in all category pages',
                    'Priority #1 ranking in search results',
                    'Elite badge with gold highlighting',
                    'Maximum visibility boost',
                    'Premium placement for buyer attention',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-secondary">
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-text-tertiary italic">
                  The choice of professional sellers and top contractors.
                </p>
              </CardContent>
            </Card>

            {/* Key Highlights */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="text-amber-500">👑</span> What Elite Includes
                </h2>
                <p className="text-text-secondary mb-6">
                  Elite Placement is the complete package for maximum exposure:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: '🏠', text: 'Homepage featured section' },
                    { icon: '🔍', text: '#1 search priority' },
                    { icon: '👑', text: 'Elite gold badge' },
                    { icon: '📈', text: 'Maximum visibility boost' },
                    { icon: '📧', text: 'Premium buyer exposure' },
                    { icon: '⚡', text: 'Top-tier placement' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-navy-900 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="text-amber-500">👑</span> Placement Tiers Comparison
                </h2>
                <p className="text-text-secondary mb-6">
                  See how Elite compares to other tiers:
                </p>
                <div className="divide-y divide-border-default">
                  {[
                    { label: 'Standard (Free)', value: 'Basic listing visibility', highlight: false },
                    { label: 'Featured', value: 'Highlighted in category', highlight: false },
                    { label: 'Premium', value: 'Top of search + category', highlight: false },
                    { label: 'Elite', value: 'Homepage + all benefits + 5x views', highlight: true },
                  ].map((spec, i) => (
                    <div key={i} className={`flex justify-between py-3 ${spec.highlight ? 'bg-amber-50 -mx-6 px-6' : ''}`}>
                      <span className={`${spec.highlight ? 'font-semibold text-amber-700' : 'text-text-secondary'}`}>{spec.label}</span>
                      <span className={`font-medium ${spec.highlight ? 'text-amber-700' : 'text-navy-900'}`}>
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Why Elite Placement */}
            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="text-amber-500">👑</span> Why Choose Elite?
                </h2>
                <p className="text-text-secondary mb-6">
                  Elite Placement is for serious sellers who want the absolute maximum exposure and fastest results.
                </p>
                <p className="text-text-secondary mb-6">
                  Compare all placement tiers:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Premium */}
                  <div className="bg-white rounded-xl p-5 border border-border-default">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-100 text-blue-700 border-0">Premium</Badge>
                      <span className="font-semibold text-navy-900">Placement</span>
                    </div>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Top of category
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Highlighted card
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        More clicks + inquiries
                      </li>
                    </ul>
                  </div>

                  {/* Elite */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-rail-orange/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-rail-orange text-white border-0">Elite</Badge>
                      <span className="font-semibold text-navy-900">Placement</span>
                    </div>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Homepage visibility
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Category top
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Search priority
                      </li>
                    </ul>
                    <p className="text-xs text-rail-orange font-medium mt-3">
                      Most exposure for serious sellers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How Featured Listings Work */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4">How Featured Listings Work</h2>
                <p className="text-text-secondary mb-6">Featured placements are ideal for:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    'Hi-rail vehicles',
                    'Locomotives',
                    'Rail equipment',
                    'Inspection tools',
                    'Materials & supplies',
                    'Contractor services',
                    'Rentals',
                    'Specialized machinery',
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 bg-surface-secondary rounded-lg">
                      <span className="text-sm text-navy-900">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-text-secondary">
                  Every upgrade pushes you higher in search, maps, categories, and homepage visibility.
                </p>
              </CardContent>
            </Card>

            {/* How to Purchase */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-navy-900 mb-4">How to Purchase</h2>
                <p className="text-text-secondary">
                  Simply select &quot;Featured&quot;, &quot;Premium&quot;, or &quot;Elite&quot; during listing creation or from your Seller Dashboard.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Price Box */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-text-tertiary text-sm mb-1">Elite Placement</p>
                  <p className="text-3xl font-bold text-amber-600">$99</p>
                  <p className="text-text-secondary text-sm">for 30 days of maximum visibility</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link href="/pricing" className="block">
                    <Button className="w-full bg-rail-orange hover:bg-rail-orange/90 text-white font-semibold py-6 text-lg">
                      ⭐ Become a Featured Listing
                    </Button>
                  </Link>
                  <Link href="/listings/create" className="block">
                    <Button variant="outline" className="w-full py-5">
                      Create Your Listing
                    </Button>
                  </Link>
                </div>

                <div className="border-t border-border-default pt-6">
                  <h3 className="font-semibold text-navy-900 mb-4">Example Seller Info</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-navy-900/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-navy-900/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900">Your Company Name</p>
                      <div className="flex items-center gap-1 text-sm text-emerald-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified Seller
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location, USA
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Responds within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add-ons Promo */}
            <Card className="bg-gradient-to-br from-navy-900 to-navy-800 text-white">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3">Marketplace Add-Ons</h3>
                <ul className="space-y-2 text-sm text-white/80 mb-4">
                  <li className="flex items-center gap-2">
                    <span className="text-rail-orange">⭐</span> Featured Placement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">🚀</span> Premium Boost
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">👑</span> Elite Visibility
                  </li>
                  <li className="flex items-center gap-2">
                    {/* S-2.5: Neutral AI language */}
                    <span className="text-purple-400">🤖</span> AI-Assisted Content
                  </li>
                </ul>
                <Link href="/pricing">
                  <Button size="sm" className="w-full bg-rail-orange hover:bg-rail-orange/90">
                    View All Add-Ons
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="mt-12 bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Want your listing to appear like this?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Upgrade your visibility and reach more buyers, contractors, and rail companies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button size="lg" className="bg-rail-orange hover:bg-rail-orange/90 text-white font-semibold px-8 py-6 text-lg">
                ⭐ Become a Featured Listing
              </Button>
            </Link>
            <Link href="/listings/create">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Create Free Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-text-tertiary text-sm">
            This example listing is provided for demonstration only.<br />
            Use it to preview the final layout and test your marketplace functionality.
          </p>
        </div>
      </main>
    </div>
  );
}
