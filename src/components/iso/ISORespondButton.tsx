/**
 * THE RAIL EXCHANGE™ — ISO Respond Button Component
 * 
 * Client component for responding to ISO requests.
 * Handles authentication check and response modal.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ISORespondButtonProps {
  requestId: string;
  requestTitle: string;
  allowMessaging: boolean;
  ownerId: string;
}

export default function ISORespondButton({
  requestId,
  requestTitle,
  allowMessaging,
  ownerId,
}: ISORespondButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isOwner = session?.user?.id === ownerId;

  const handleRespond = async () => {
    if (status !== 'authenticated') {
      router.push(`/auth/signin?callbackUrl=/iso/${requestId}`);
      return;
    }

    if (isOwner) {
      return;
    }

    setShowModal(true);
  };

  const submitResponse = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch(`/api/iso/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send response');
      }

      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setSending(false);
    }
  };

  if (isOwner) {
    return (
      <Link
        href="/dashboard/iso"
        className="block w-full text-center px-4 py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors"
      >
        Manage in Dashboard
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={handleRespond}
        className="w-full px-4 py-3 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Respond to Request
      </button>

      {status !== 'authenticated' && (
        <p className="text-xs text-text-secondary mt-2 text-center">
          You&apos;ll need to sign in to respond
        </p>
      )}

      {/* Response Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">Response Sent!</h3>
                  <p className="text-text-secondary mb-6">
                    The requester has been notified and may reach out to you directly.
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSuccess(false);
                    }}
                    className="px-6 py-2.5 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-navy-900">Respond to Request</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-text-secondary">Responding to:</p>
                    <p className="font-medium text-navy-900">{requestTitle}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Your Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rail-orange/50 focus:border-rail-orange resize-none"
                      placeholder="Describe what you can offer, including details about your equipment, availability, pricing, etc."
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitResponse}
                      disabled={sending || !message.trim()}
                      className="flex-1 px-4 py-2.5 bg-rail-orange text-white font-semibold rounded-lg hover:bg-rail-orange-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Response
                        </>
                      )}
                    </button>
                  </div>

                  {allowMessaging && (
                    <p className="text-xs text-text-secondary mt-4 text-center">
                      💬 This requester allows direct messaging after initial response.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
