/**
 * THE RAIL EXCHANGE™ — Contact Section
 * 
 * Displays entity contact information.
 * Respects entitlement restrictions.
 * NO mock data.
 */

import Link from 'next/link';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import type { ContactSectionProps } from '../types';

export function ContactSection({ contact, canDisplayContact = true }: ContactSectionProps) {
  // Contact display restricted
  if (!canDisplayContact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">
            Contact information is available after verification.
          </p>
        </div>
      </div>
    );
  }

  // No contact data
  if (!contact) {
    return null;
  }

  const hasAnyContact = contact.email || contact.phone || contact.website || contact.address;

  if (!hasAnyContact) {
    return null;
  }

  // Format address
  const addressParts = [
    contact.address?.street,
    contact.address?.city,
    contact.address?.state,
    contact.address?.zip,
    contact.address?.country,
  ].filter(Boolean);
  const addressString = addressParts.join(', ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>

      <div className="space-y-3">
        {/* Email */}
        {contact.email && (
          <Link
            href={`mailto:${contact.email}`}
            className="flex items-center gap-3 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <span className="text-sm">{contact.email}</span>
          </Link>
        )}

        {/* Phone */}
        {contact.phone && (
          <Link
            href={`tel:${contact.phone}`}
            className="flex items-center gap-3 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <span className="text-sm">{contact.phone}</span>
          </Link>
        )}

        {/* Website */}
        {contact.website && (
          <Link
            href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              <Globe className="h-4 w-4 text-slate-500" />
            </div>
            <span className="text-sm truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
          </Link>
        )}

        {/* Address */}
        {addressString && (
          <div className="flex items-start gap-3 text-gray-600">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-slate-500" />
            </div>
            <span className="text-sm">{addressString}</span>
          </div>
        )}
      </div>

      {/* Contact Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href="#inquiry"
          className="w-full inline-flex items-center justify-center h-10 px-4 bg-rail-orange text-white text-sm font-medium rounded-lg hover:bg-[#e55f15] transition-colors"
        >
          Send Inquiry
        </Link>
      </div>
    </div>
  );
}

export default ContactSection;
