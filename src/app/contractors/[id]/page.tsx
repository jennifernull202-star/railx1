/**
 * THE RAIL EXCHANGE™ — Contractor Profile Page
 * 
 * Displays a contractor's full profile with services, contact info, and photos.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import connectDB from '@/lib/db';
import ContractorProfile from '@/models/ContractorProfile';
import { SERVICE_CATEGORIES } from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    await connectDB();
    const { id } = await params;
    const contractor = await ContractorProfile.findById(id);

    if (!contractor) {
      return { title: 'Contractor Not Found | The Rail Exchange' };
    }

    return {
      title: `${contractor.businessName} | Rail Contractor | The Rail Exchange`,
      description: contractor.businessDescription.substring(0, 160),
    };
  } catch {
    return { title: 'Contractor | The Rail Exchange' };
  }
}

export default async function ContractorProfilePage({ params }: PageProps) {
  await connectDB();

  const { id } = await params;
  const contractor = await ContractorProfile.findById(id).populate('userId', 'name image');

  if (!contractor || !contractor.isActive) {
    notFound();
  }

  // Get service labels
  const serviceLabels = contractor.services.map((serviceId: string) => {
    const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
    return service?.label || serviceId;
  });

  return (
    <>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-border/50">
        <nav className="container-rail">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center">
              <span className="text-heading-lg font-bold text-navy-900">The Rail</span>
              <span className="text-heading-lg font-bold text-rail-orange ml-1">Exchange</span>
              <span className="text-rail-orange text-sm font-medium ml-0.5">™</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/contractors" className="text-body-md font-medium text-text-secondary hover:text-navy-900">
                ← All Contractors
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 bg-surface-secondary">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-navy-900 to-navy-800 relative">
          {contractor.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getImageUrl(contractor.coverImage)}
              alt={`${contractor.businessName} cover`}
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>

        <div className="container-rail relative">
          {/* Profile Header */}
          <div className="relative -mt-20 mb-8">
            <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-surface-secondary rounded-xl border border-surface-border flex items-center justify-center overflow-hidden">
                    {contractor.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(contractor.logo)}
                        alt={contractor.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-text-tertiary">
                        {contractor.businessName.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-heading-xl font-bold text-navy-900">
                          {contractor.businessName}
                        </h1>
                        {contractor.verificationStatus === 'verified' && (
                          <span className="badge-verified">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-body-md text-text-secondary mb-4">
                        {contractor.address?.city && contractor.address?.state 
                          ? `${contractor.address.city}, ${contractor.address.state} • ` 
                          : ''}{contractor.yearsInBusiness} years in business
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {serviceLabels.slice(0, 4).map((label: string) => (
                          <span
                            key={label}
                            className="px-3 py-1 bg-surface-secondary rounded-full text-body-sm font-medium text-navy-900"
                          >
                            {label}
                          </span>
                        ))}
                        {serviceLabels.length > 4 && (
                          <span className="px-3 py-1 bg-surface-secondary rounded-full text-body-sm font-medium text-text-secondary">
                            +{serviceLabels.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact Button */}
                    <div className="flex flex-col gap-2">
                      <a
                        href={`mailto:${contractor.businessEmail}`}
                        className="btn-primary py-3 px-6"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact
                      </a>
                      <a
                        href={`tel:${contractor.businessPhone}`}
                        className="btn-outline py-3 px-6"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 pb-16">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                <h2 className="heading-lg mb-4">About</h2>
                <p className="body-md whitespace-pre-wrap">{contractor.businessDescription}</p>
                {contractor.serviceDescription && (
                  <div className="mt-6 pt-6 border-t border-surface-border">
                    <h3 className="heading-sm mb-3">Service Details</h3>
                    <p className="body-md">{contractor.serviceDescription}</p>
                  </div>
                )}
              </div>

              {/* Services */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                <h2 className="heading-lg mb-6">Services</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {contractor.services.map((serviceId: string) => {
                    const service = SERVICE_CATEGORIES.find((s) => s.id === serviceId);
                    return (
                      <div
                        key={serviceId}
                        className="flex items-start gap-3 p-4 bg-surface-secondary rounded-xl"
                      >
                        <div className="w-8 h-8 bg-rail-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-rail-orange" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-body-md font-medium text-navy-900">
                            {service?.label || serviceId}
                          </p>
                          {service?.description && (
                            <p className="text-body-sm text-text-secondary mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              {contractor.equipmentOwned && contractor.equipmentOwned.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                  <h2 className="heading-lg mb-4">Equipment</h2>
                  <div className="flex flex-wrap gap-2">
                    {contractor.equipmentOwned.map((item: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-surface-secondary rounded-lg text-body-sm font-medium text-navy-900"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {contractor.photos && contractor.photos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-8">
                  <h2 className="heading-lg mb-6">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {contractor.photos.map((photo: string, index: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={index}
                        src={photo}
                        alt={`${contractor.businessName} photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h3 className="heading-md mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-caption text-text-tertiary">Phone</p>
                      <a href={`tel:${contractor.businessPhone}`} className="text-body-md font-medium text-navy-900 hover:text-rail-orange">
                        {contractor.businessPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-caption text-text-tertiary">Email</p>
                      <a href={`mailto:${contractor.businessEmail}`} className="text-body-md font-medium text-navy-900 hover:text-rail-orange break-all">
                        {contractor.businessEmail}
                      </a>
                    </div>
                  </div>

                  {contractor.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-caption text-text-tertiary">Website</p>
                        <a
                          href={contractor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body-md font-medium text-rail-orange hover:text-rail-orange-dark break-all"
                        >
                          {contractor.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h3 className="heading-md mb-4">Location</h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    {contractor.address.street && (
                      <p className="text-body-md text-navy-900">{contractor.address.street}</p>
                    )}
                    <p className="text-body-md text-navy-900">
                      {contractor.address.city}, {contractor.address.state} {contractor.address.zipCode}
                    </p>
                    <p className="text-body-sm text-text-secondary">{contractor.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Regions Served */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h3 className="heading-md mb-4">Regions Served</h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.regionsServed.map((region: string) => (
                    <span
                      key={region}
                      className="px-3 py-1.5 bg-navy-900/5 rounded-lg text-body-sm font-medium text-navy-900"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              {/* Company Stats */}
              <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
                <h3 className="heading-md mb-4">Company Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-secondary">Years in Business</span>
                    <span className="text-body-md font-medium text-navy-900">{contractor.yearsInBusiness}</span>
                  </div>
                  {contractor.numberOfEmployees && (
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-text-secondary">Employees</span>
                      <span className="text-body-md font-medium text-navy-900">{contractor.numberOfEmployees}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-secondary">Profile Completeness</span>
                    <span className="text-body-md font-medium text-navy-900">{contractor.profileCompleteness}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-8">
        <div className="container-rail text-center">
          <p className="text-body-sm text-white/60">
            © {new Date().getFullYear()} The Rail Exchange™. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
