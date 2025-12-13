/**
 * THE RAIL EXCHANGE™ — Verification Required Modal
 * 
 * UX Item #1: Displayed when user attempts to publish without verification.
 * Shows clear message that draft is saved and provides path to verification.
 */

'use client';

import { useRouter } from 'next/navigation';
import { Shield, X, FileText } from 'lucide-react';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExpired?: boolean;
  onVerifyClick?: () => void;
}

export default function VerificationRequiredModal({
  isOpen,
  onClose,
  isExpired = false,
  onVerifyClick,
}: VerificationRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleVerifyClick = () => {
    // Log event: verification_checkout_clicked_from_publish
    console.log('[EVENT] verification_checkout_clicked_from_publish');
    
    if (onVerifyClick) {
      onVerifyClick();
    }
    router.push('/dashboard/verification/seller');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
            isExpired ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Shield className={`w-8 h-8 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-navy-900 text-center mb-2">
            {isExpired ? 'Verification Expired' : 'Verification Required to Publish'}
          </h2>

          {/* Message */}
          <p className="text-slate-600 text-center mb-4">
            {isExpired 
              ? 'Your seller verification has expired. Please renew to publish listings.'
              : 'Seller verification is required to publish listings on The Rail Exchange.'
            }
          </p>

          {/* Draft Saved Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Draft Saved</p>
              <p className="text-sm text-blue-700">
                Your listing has been saved as a draft. You can publish it after completing verification.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleVerifyClick}
              className="w-full py-3 px-4 bg-rail-orange text-white font-semibold rounded-xl hover:bg-[#e55f15] transition-colors"
            >
              {isExpired ? 'Renew Verification' : 'Get Verified Now'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Continue Editing Draft
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-slate-500 text-center mt-4">
            Verification confirms your business documents have been reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
