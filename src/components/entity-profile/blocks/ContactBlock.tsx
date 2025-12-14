/**
 * THE RAIL EXCHANGE™ — Contact Block
 * 
 * Displays contact information for entities.
 * NO auth. NO enforcement. Pure display.
 * 
 * ANALYTICS: Tracks outbound clicks (phone, email, website) for 
 * Professional plan analytics dashboards.
 */

'use client';

import { Mail, Phone, Globe, MapPin, MessageSquare } from 'lucide-react';
import { Entity } from '@/types/entity';
import { ContactBlockProps } from '../types';
import { useOutboundClick } from '@/lib/hooks/useOutboundClick';

export function ContactBlock({ entity, showInquiryButton = true }: ContactBlockProps) {
  // Setup click tracking
  const trackClick = useOutboundClick(
    entity?.type === 'contractor' ? 'contractor' : 'seller',
    entity?.id || ''
  );

  if (!entity) {
    return null;
  }

  // Check if contact display is allowed
  if (!entity.entitlements.canDisplayContact) {
    return null;
  }

  const contact = entity.contact;
  
  // Check if there's any contact info to display
  const hasContactInfo = contact && (
    contact.email ||
    contact.phone ||
    contact.website ||
    (contact.address && (contact.address.city || contact.address.state))
  );

  if (!hasContactInfo && !entity.entitlements.canReceiveInquiries) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>

      {/* Contact Info */}
      {hasContactInfo && (
        <div className="space-y-3 mb-4">
          {contact?.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={() => trackClick('email')}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{contact.email}</span>
            </a>
          )}

          {contact?.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={() => trackClick('phone')}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{contact.phone}</span>
            </a>
          )}

          {contact?.website && (
            <a
              href={contact.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('website')}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-sm truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}

          {contact?.address && (contact.address.city || contact.address.state) && (
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="text-sm">
                {contact.address.street && <p>{contact.address.street}</p>}
                <p>
                  {[contact.address.city, contact.address.state, contact.address.zip]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {contact.address.country && contact.address.country !== 'USA' && (
                  <p>{contact.address.country}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inquiry Button */}
      {showInquiryButton && entity.entitlements.canReceiveInquiries && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Send Inquiry
        </button>
      )}
    </div>
  );
}

export default ContactBlock;
