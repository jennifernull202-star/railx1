/**
 * THE RAIL EXCHANGE™ — Become a Contractor Page
 * 
 * Allows sellers to opt-in to contractor capabilities.
 * Sets isContractor: true via PATCH /api/user/update
 */

"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Wrench, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BecomeContractorPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if already a contractor
  if (session?.user?.isContractor) {
    router.push("/dashboard/contractor/services");
    return null;
  }

  const handleBecomeContractor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isContractor: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update account");
      }

      // Update session to reflect new isContractor status
      await update({ isContractor: true });

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard/contractor/setup");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Users,
      title: "Access to Thousands of Buyers",
      description: "Connect with railroad equipment buyers actively looking for contractors",
    },
    {
      icon: MapPin,
      title: "Regional Visibility",
      description: "Get found by clients in your service area",
    },
    {
      icon: DollarSign,
      title: "Generate New Leads",
      description: "Receive inquiries directly from interested customers",
    },
    {
      icon: Shield,
      title: "Verified Badge Available",
      description: "Stand out with our Verified Contractor badge ($29.99/mo)",
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "Set your own availability and service terms",
    },
    {
      icon: Star,
      title: "Build Your Reputation",
      description: "Collect reviews and grow your business",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Wrench className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-navy-900 mb-4">
          Become a Railroad Contractor
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Expand your reach on The Rail Exchange. List your services, receive leads,
          and connect with railroad equipment owners who need your expertise.
        </p>
      </div>

      {/* Success State */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Welcome to the Contractor Network!
          </h2>
          <p className="text-green-700 mb-4">
            Your account has been upgraded. Redirecting you to set up your contractor profile...
          </p>
        </div>
      )}

      {/* Benefits Grid */}
      {!success && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white rounded-xl border border-surface-border p-6 hover:shadow-card transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-text-secondary">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8 text-center">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">
              Ready to Start?
            </h2>
            <p className="text-text-secondary mb-6 max-w-xl mx-auto">
              It&apos;s free to list your services. You can optionally upgrade to Verified Contractor
              for premium features and the trusted badge.
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleBecomeContractor}
                disabled={isLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Become a Contractor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Maybe Later
                </Button>
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-navy-900 mb-6">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-surface-border p-6">
                <h4 className="font-semibold text-navy-900 mb-2">
                  Is it free to become a contractor?
                </h4>
                <p className="text-text-secondary">
                  Yes! Listing your services is completely free. The optional Verified Contractor
                  badge costs $29.99/month and includes premium features.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-surface-border p-6">
                <h4 className="font-semibold text-navy-900 mb-2">
                  Can I still sell equipment?
                </h4>
                <p className="text-text-secondary">
                  Absolutely! All users can sell equipment. Becoming a contractor adds
                  additional capabilities without removing your selling features.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-surface-border p-6">
                <h4 className="font-semibold text-navy-900 mb-2">
                  What&apos;s the Verified Contractor badge?
                </h4>
                <p className="text-text-secondary">
                  Verified Contractors go through our verification process and receive
                  a trusted badge, priority placement, and access to premium leads.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
