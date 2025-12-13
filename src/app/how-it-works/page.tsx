/**
 * THE RAIL EXCHANGE™ — How It Works Page
 * 
 * Step-by-step guide for buyers, sellers, and contractors.
 * Premium UI with role-based instructions.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import {
  Search,
  ShoppingCart,
  MessageSquare,
  Heart,
  Package,
  TrendingUp,
  BarChart3,
  Shield,
  CheckCircle,
  Sparkles,
  MapPin,
  Users,
  Zap,
  ArrowRight,
  Star,
  FileText,
  Wrench,
  Crown,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works | The Rail Exchange',
  description: 'Learn how to buy, sell, and connect on The Rail Exchange™ - the premier rail industry marketplace.',
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/5 via-transparent to-rail-orange/5" />
        <div className="container-rail relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 tracking-tight mb-6">
              How <span className="text-rail-orange">The Rail Exchange</span> Works
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-6 max-w-2xl mx-auto">
              Connect with document-reviewed buyers, sellers, and contractors in the rail industry.
              Whether you&apos;re buying equipment, selling inventory, or offering services — we make it simple.
            </p>
            {/* BATCH E-4: Platform Introduction Statement */}
            <p className="text-sm text-slate-500 mb-10 max-w-2xl mx-auto">
              The Rail Exchange is a listing and introduction platform. All transactions, inspections, payments, and due diligence occur directly between buyers and sellers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-rail-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#e55f15] transition-all shadow-lg shadow-rail-orange/25"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/listings"
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-navy-900 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Buyers Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-rail">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900">For Buyers</h2>
            </div>
            <p className="text-lg text-slate-600 mb-12 max-w-2xl">
              Find exactly what you need with powerful search tools and connect directly with sellers.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Create a Free Account',
                  desc: 'Sign up in seconds. No credit card required to browse and contact sellers.',
                  icon: Users,
                },
                {
                  step: '2',
                  title: 'Search & Browse',
                  desc: 'Use our powerful search with filters for category, condition, location, and price. Map-based search finds equipment near you.',
                  icon: Search,
                },
                {
                  step: '3',
                  title: 'Connect with Sellers',
                  desc: 'Send inquiries directly to sellers. Use our built-in messaging to negotiate and finalize deals.',
                  icon: MessageSquare,
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-blue-600" />
                Buyer Features
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Save favorites to watchlist',
                  'Set up saved searches',
                  'Get email alerts for new listings',
                  'Message history with sellers',
                  'Find local contractors',
                  'Map-based search',
                  'Filter by condition & price',
                  'View seller ratings',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sellers Section */}
      <section className="py-20 bg-white">
        <div className="container-rail">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rail-orange/10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-rail-orange" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900">For Sellers</h2>
            </div>
            <p className="text-lg text-slate-600 mb-12 max-w-2xl">
              List your equipment and reach thousands of qualified buyers in the rail industry.
            </p>

            <div className="grid md:grid-cols-5 gap-6">
              {[
                {
                  step: '1',
                  title: 'Choose a Plan',
                  desc: 'Select monthly or yearly billing. Plans start at $29/mo.',
                  icon: Crown,
                },
                {
                  step: '2',
                  title: 'Create Listings',
                  desc: 'Add photos, specs, and details. AI helps optimize your content.',
                  icon: FileText,
                },
                {
                  step: '3',
                  title: 'Boost Visibility',
                  desc: 'Use add-ons like Featured or Premium placement for more views.',
                  icon: TrendingUp,
                },
                {
                  step: '4',
                  title: 'Manage Inquiries',
                  desc: 'Respond to buyer messages and negotiate deals from your dashboard.',
                  icon: MessageSquare,
                },
                {
                  step: '5',
                  title: 'Track Performance',
                  desc: 'Analytics show views, inquiries, and conversion metrics.',
                  icon: BarChart3,
                },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-rail-orange text-white rounded-xl flex items-center justify-center font-bold mb-4">
                    {item.step}
                  </div>
                  <item.icon className="w-6 h-6 text-rail-orange mx-auto mb-2" />
                  <h3 className="font-semibold text-navy-900 mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Featured Listing',
                  price: '$20',
                  desc: 'Homepage placement and category highlights for 30 days',
                  icon: Star,
                },
                {
                  title: 'AI Enhancement',
                  price: 'Add-on',
                  desc: 'AI optimizes your title, description, and tags for better search visibility',
                  icon: Sparkles,
                },
                {
                  title: 'Spec Sheet PDF',
                  price: 'Add-on',
                  desc: 'Generate professional PDF spec sheets buyers can download',
                  icon: FileText,
                },
              ].map((addon, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <addon.icon className="w-5 h-5 text-rail-orange" />
                    <h4 className="font-semibold text-navy-900">{addon.title}</h4>
                    <span className="ml-auto text-sm font-medium text-rail-orange">{addon.price}</span>
                  </div>
                  <p className="text-sm text-slate-600">{addon.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contractors Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-rail">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy-900">For Contractors</h2>
            </div>
            <p className="text-lg text-slate-600 mb-12 max-w-2xl">
              Showcase your services, build trust with verification, and receive project inquiries.
            </p>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: '1',
                  title: 'Complete Onboarding',
                  desc: 'Fill out your business profile with services, regions, and certifications.',
                  icon: FileText,
                },
                {
                  step: '2',
                  title: 'Get Verified (Optional)',
                  desc: 'Subscribe for $24/mo to get the verified badge and priority placement.',
                  icon: Shield,
                },
                {
                  step: '3',
                  title: 'Appear in Search',
                  desc: 'Document-reviewed contractors rank higher in search results and display verification indicators.',
                  icon: Search,
                },
                {
                  step: '4',
                  title: 'Receive Inquiries',
                  desc: 'Buyers and companies reach out for quotes and projects through your dashboard.',
                  icon: MessageSquare,
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-green-50 rounded-2xl p-8 border border-green-100">
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Document-Reviewed Contractor Benefits
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Verification badge on profile',
                  'Priority in search results',
                  'Verification indicators for buyers',
                  'Featured in directory',
                  'Document review process',
                  'Analytics dashboard',
                  'Priority support',
                  'Enhanced profile visibility',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Search Section */}
      <section className="py-20 bg-white">
        <div className="container-rail">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-navy-900">Map-Based Search</h2>
                </div>
                <p className="text-lg text-slate-600 mb-6">
                  Find equipment and contractors near you with our integrated Google Maps search. 
                  Filter by distance, see exact locations, and connect with local sellers.
                </p>
                <ul className="space-y-3">
                  {[
                    'Search by city, state, or zip code',
                    'Filter results by radius (25-500 miles)',
                    'See listings on an interactive map',
                    'Find local contractors for your projects',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-100 rounded-2xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Interactive Map Search</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-rail">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Join thousands of rail industry professionals on The Rail Exchange
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-rail-orange text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#e55f15] transition-all shadow-lg shadow-rail-orange/25 text-lg"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-navy-900 text-navy-900 px-8 py-4 rounded-xl font-semibold hover:bg-navy-50 transition-colors text-lg"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BATCH E-5: Governance FAQ Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="container-rail">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-navy-900 mb-8 text-center">
              Platform Governance
            </h2>
            
            {/* FAQ: Fraud/Misrepresentation Protections */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-navy-900 mb-4">
                What protections does The Rail Exchange provide against fraud or misrepresentation?
              </h3>
              <div className="text-slate-600 space-y-3">
                <p>
                  The Rail Exchange performs document review for verification and enforces platform policies.
                </p>
                <p>
                  Buyers and sellers are responsible for conducting their own due diligence, inspections, and transaction safeguards.
                </p>
                <p>
                  The platform does not provide escrow, payment guarantees, or transaction insurance.
                </p>
              </div>
            </div>

            {/* BATCH E-5: Admin Authority Boundary Statement */}
            <p className="text-sm text-slate-500 text-center mt-8">
              Administrative actions are discretionary and based on available information at the time of review.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
