/**
 * THE RAIL EXCHANGE™ — Dense Footer Component
 * 
 * Amazon-style dense footer with multiple link columns.
 * Height: ~280px
 */

import Link from 'next/link';

export function DenseFooter() {
  return (
    <footer className="bg-navy-900 text-white">
      {/* Main Footer Content */}
      <div className="container-rail max-w-[1440px] mx-auto px-4 md:px-8 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 pb-10 border-b border-white/10">
          
          {/* Buy Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Buy
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/marketplace/category/locomotives" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Locomotives
                </Link>
              </li>
              <li>
                <Link href="/marketplace/category/railcars" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Railcars
                </Link>
              </li>
              <li>
                <Link href="/marketplace/category/track-materials" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Track Materials
                </Link>
              </li>
              <li>
                <Link href="/listings?category=tools-equipment" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Tools & Equipment
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  All Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Sell
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/listings/create" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Create Listing
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Contractors Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Contractors
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/contractors" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Find Contractors
                </Link>
              </li>
              <li>
                <Link href="/contractors/onboard" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Become a Contractor
                </Link>
              </li>
              <li>
                <Link href="/contractors?verified=true" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Verified Contractors
                </Link>
              </li>
              <li>
                <Link href="/dashboard/contractor/verify" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Get Verified
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/how-it-works" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="mailto:support@therailexchange.com" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-white/60 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <span className="text-[18px] font-bold text-white">The Rail</span>
            <span className="text-[18px] font-bold text-rail-orange ml-1">Exchange</span>
            <span className="text-rail-orange text-[10px] font-medium ml-0.5">™</span>
          </Link>

          {/* Copyright */}
          <p className="text-[12px] text-white/40">
            © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.linkedin.com/company/the-rail-exchange" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Follow us on LinkedIn" 
              className="text-white/40 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default DenseFooter;
