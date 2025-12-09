import React from "react";

export const metadata = {
  title: "Privacy Policy | The Rail Exchange™",
  description: "Privacy policy governing use of The Rail Exchange™ marketplace platform.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">
        Privacy Policy
      </h1>
      <p className="text-slate-500 mb-10">Last updated: December 9, 2025</p>

      <p className="text-slate-600 leading-relaxed mb-8">
        This Privacy Policy explains how The Rail Exchange™ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
        collects, uses, and protects information when you access or use our
        website, marketplace, and related services (&quot;Platform&quot;).
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        1. Information We Collect
      </h2>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.1 Personal Information
      </h3>
      <ul className="text-slate-600 list-disc pl-6 mb-6 space-y-1">
        <li>Name</li>
        <li>Account details</li>
        <li>Phone number</li>
        <li>Business information</li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.2 Business & Listing Information
      </h3>
      <p className="text-slate-600 mb-6">
        Includes listing data, contractor profile information, uploaded documents,
        certifications, and service or equipment details.
      </p>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.3 Usage Information
      </h3>
      <p className="text-slate-600 mb-6">
        Includes device data, IP address, browser type, pages visited, and search activity.
      </p>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.4 Location Information
      </h3>
      <p className="text-slate-600 mb-6">
        If location features are enabled, approximate location may be collected to improve search accuracy.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        2. How We Use Information
      </h2>
      <ul className="text-slate-600 list-disc pl-6 mb-8 space-y-1">
        <li>Operate and maintain the Platform</li>
        <li>Process listings and contractor onboarding</li>
        <li>Improve search accuracy and functionality</li>
        <li>Enhance security and prevent fraudulent activity</li>
        <li>Support account and listing management</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        3. Sharing of Information
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        Information may be shared with other users, service providers, compliance
        partners, or legal authorities when required. We do not sell personal data.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        4. Cookies & Tracking
      </h2>
      <p className="text-slate-600 mb-8">
        Cookies help improve performance, store preferences, and analyze Platform
        usage. Disabling cookies may affect functionality.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        5. Data Security
      </h2>
      <p className="text-slate-600 mb-8">
        We implement standard security practices to protect data. However, no
        system is completely secure.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        6. Your Rights
      </h2>
      <p className="text-slate-600 mb-8">
        You may request access, correction, deletion, or export of your
        information based on applicable laws.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        7. Updates to This Policy
      </h2>
      <p className="text-slate-600">
        We may update this Privacy Policy periodically. Updated versions will
        include a revised effective date.
      </p>
    </main>
  );
}
