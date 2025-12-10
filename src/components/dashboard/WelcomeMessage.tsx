/**
 * THE RAIL EXCHANGE™ — Welcome Message Component
 * 
 * Shows a welcome banner for new users explaining how to get started.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Package, Wrench, CreditCard, CheckCircle } from 'lucide-react';

interface WelcomeMessageProps {
  userName: string;
  hasListings: boolean;
  hasSubscription: boolean;
  isContractor: boolean;
}

export default function WelcomeMessage({ 
  userName, 
  hasListings, 
  hasSubscription, 
  isContractor 
}: WelcomeMessageProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has previously dismissed the welcome message
    const wasDismissed = localStorage.getItem('welcome_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('welcome_dismissed', 'true');
  };

  // Don't show if user has already set up their account or dismissed
  if (!mounted || dismissed || (hasListings && (hasSubscription || isContractor))) {
    return null;
  }

  const steps = [
    {
      id: 'browse',
      title: 'Browse the Marketplace',
      description: 'Explore equipment, materials, and contractors',
      href: '/listings',
      icon: Package,
      completed: false,
    },
    {
      id: 'seller',
      title: 'Want to Upgrade?',
      description: 'Choose a plan to list your equipment',
      href: '/dashboard/upgrade',
      icon: CreditCard,
      completed: hasSubscription,
    },
    {
      id: 'contractor',
      title: 'Become a Contractor',
      description: 'Offer your services to the rail industry',
      href: '/contractors/onboard',
      icon: Wrench,
      completed: isContractor,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Dismiss welcome message"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome to The Rail Exchange, {userName}! 🚂
          </h2>
          <p className="text-white/70 text-lg">
            Here&apos;s how to get started with your account
          </p>
        </div>

        {/* Getting Started Steps */}
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className={`group relative bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all ${
                step.completed ? 'ring-2 ring-green-400' : ''
              }`}
            >
              {step.completed && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  step.completed ? 'bg-green-500/20' : 'bg-rail-orange/20'
                }`}>
                  <step.icon className={`w-6 h-6 ${
                    step.completed ? 'text-green-400' : 'text-rail-orange'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-rail-orange transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick tip */}
        <div className="mt-6 flex items-center gap-3 text-white/60 text-sm">
          <div className="w-5 h-5 bg-rail-orange/20 rounded-full flex items-center justify-center">
            <span className="text-rail-orange text-xs">💡</span>
          </div>
          <span>
            <strong className="text-white/80">Tip:</strong> You can dismiss this message once you&apos;re familiar with the platform.
          </span>
        </div>
      </div>
    </div>
  );
}
