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
      <p className="text-slate-500 mb-10">Last updated: December 12, 2025</p>

      <p className="text-slate-600 leading-relaxed mb-8">
        This Privacy Policy explains how The Rail Exchange™ (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
        collects, uses, and protects information when you access or use our
        website, marketplace, and related services (&quot;Platform&quot;).
      </p>

      {/* Section 1: Information We Collect */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        1. Information We Collect
      </h2>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.1 Personal Information
      </h3>
      <ul className="text-slate-600 list-disc pl-6 mb-6 space-y-1">
        <li>Name and email address</li>
        <li>Account credentials (password stored in hashed form)</li>
        <li>Phone number (if provided)</li>
        <li>Business name and information</li>
        <li>Billing information (processed by Stripe; we do not store full payment card details)</li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.2 Business &amp; Listing Information
      </h3>
      <p className="text-slate-600 mb-6">
        Includes listing data, contractor profile information, uploaded documents,
        certifications, images, and service or equipment details.
      </p>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.3 Usage Information
      </h3>
      <p className="text-slate-600 mb-6">
        Includes device data, IP address, browser type, pages visited, search queries, and interaction patterns.
      </p>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        1.4 Location Information
      </h3>
      <p className="text-slate-600 mb-6">
        If location features are enabled, approximate location may be collected to improve search accuracy.
      </p>

      {/* Section 2: How We Use Information */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        2. How We Use Information
      </h2>
      <ul className="text-slate-600 list-disc pl-6 mb-8 space-y-1">
        <li>Operate and maintain the Platform</li>
        <li>Process listings and contractor onboarding</li>
        <li>Facilitate communication between users</li>
        <li>Improve search accuracy and functionality</li>
        <li>Enhance security and prevent fraudulent activity</li>
        <li>Support account and listing management</li>
        <li>Send transactional emails (account verification, password reset, inquiry notifications)</li>
      </ul>

      {/* Section 3: Sharing of Information */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        3. Sharing of Information
      </h2>
      <p className="text-slate-600 leading-relaxed mb-4">
        We may share information with:
      </p>
      <ul className="text-slate-600 list-disc pl-6 mb-4 space-y-1">
        <li><strong>Other users:</strong> Listing and profile information is visible to Platform users</li>
        <li><strong>Service providers:</strong> Payment processing (Stripe), email delivery (Resend), cloud hosting (Vercel, AWS)</li>
        <li><strong>Legal authorities:</strong> When required by law or to protect rights and safety</li>
      </ul>
      <p className="text-slate-600 mb-8">
        <strong>We do not sell personal data to third parties.</strong>
      </p>

      {/* Section 4: Cookies & Session Information */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        4. Cookies &amp; Session Information
      </h2>
      <p className="text-slate-600 mb-4">
        We use cookies and similar technologies to:
      </p>
      <ul className="text-slate-600 list-disc pl-6 mb-4 space-y-1">
        <li>Maintain your authenticated session</li>
        <li>Store preferences</li>
        <li>Analyze Platform usage</li>
      </ul>
      <p className="text-slate-600 mb-8">
        <strong>Session duration:</strong> Authentication sessions (JWT tokens) have a maximum lifetime of 24 hours, with automatic logout after 4 hours of inactivity. 
        You may clear cookies at any time through your browser settings, which will end your session.
      </p>

      {/* Section 5: Data Security */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        5. Data Security
      </h2>
      <p className="text-slate-600 mb-8">
        We implement industry-standard security practices including HTTPS encryption, 
        hashed password storage, and access controls. However, no system is completely 
        secure, and we cannot guarantee absolute security.
      </p>

      {/* Section 6: Data Retention */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        6. Data Retention
      </h2>
      <p className="text-slate-600 mb-8">
        We retain your personal information for as long as your account is active or as needed 
        to provide services. Upon account deletion, we will delete or anonymize your personal 
        data within 30 days, except where retention is required by law or for legitimate 
        business purposes (e.g., fraud prevention, legal compliance).
      </p>

      {/* Section 7: Your Rights (GDPR) */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        7. Your Rights Under GDPR (European Users)
      </h2>
      <p className="text-slate-600 mb-4">
        If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, 
        you have the following rights under the General Data Protection Regulation (GDPR):
      </p>
      <ul className="text-slate-600 list-disc pl-6 mb-4 space-y-2">
        <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
        <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
        <li><strong>Right to Restriction:</strong> Request that we limit how we use your data.</li>
        <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
        <li><strong>Right to Object:</strong> Object to processing of your personal data for certain purposes.</li>
        <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, withdraw that consent at any time.</li>
      </ul>
      <p className="text-slate-600 mb-8">
        To exercise these rights, contact us at <strong>privacy@therailexchange.com</strong>. 
        We will respond within 30 days.
      </p>

      {/* Section 8: California Privacy Rights (CCPA) */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        8. California Privacy Rights (CCPA)
      </h2>
      <p className="text-slate-600 mb-4">
        If you are a California resident, you have additional rights under the California 
        Consumer Privacy Act (CCPA):
      </p>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Categories of Personal Information Collected
      </h3>
      <ul className="text-slate-600 list-disc pl-6 mb-4 space-y-1">
        <li>Identifiers (name, email, IP address)</li>
        <li>Commercial information (transaction history, listings)</li>
        <li>Internet activity (browsing history, search queries on our Platform)</li>
        <li>Geolocation data (approximate location if enabled)</li>
        <li>Professional information (business details, certifications)</li>
      </ul>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Your CCPA Rights
      </h3>
      <ul className="text-slate-600 list-disc pl-6 mb-4 space-y-2">
        <li><strong>Right to Know:</strong> Request disclosure of what personal information we collect, use, and share.</li>
        <li><strong>Right to Delete:</strong> Request deletion of your personal information.</li>
        <li><strong>Right to Opt-Out of Sale:</strong> We do not sell personal information. However, you may still 
          submit an opt-out request to confirm this status.</li>
        <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
      </ul>
      <p className="text-slate-600 mb-8">
        To exercise your CCPA rights, contact us at <strong>privacy@therailexchange.com</strong> or use 
        our contact form. We will verify your identity before processing requests.
      </p>

      {/* Section 9: International Data Transfers */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        9. International Data Transfers
      </h2>
      <p className="text-slate-600 mb-8">
        Your information may be transferred to and processed in the United States, where our 
        servers are located. By using the Platform, you consent to this transfer. We take 
        appropriate safeguards to protect your data in accordance with this Privacy Policy.
      </p>

      {/* Section 10: Enterprise Customers */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        10. Enterprise Customers
      </h2>
      <p className="text-slate-600 mb-8">
        A Data Processing Addendum (DPA) is available upon request for enterprise customers 
        who require additional contractual data protection terms. Contact <strong>enterprise@therailexchange.com</strong> to request a DPA.
      </p>

      {/* Section 11: Updates to This Policy */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        11. Updates to This Policy
      </h2>
      <p className="text-slate-600 mb-8">
        We may update this Privacy Policy periodically. Updated versions will include a 
        revised effective date. Material changes will be communicated via email or Platform notice.
      </p>

      {/* Section 12: Contact Us */}
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        12. Contact Us
      </h2>
      <p className="text-slate-600 mb-4">
        For privacy-related inquiries or to exercise your rights:
      </p>
      <ul className="text-slate-600 list-none mb-8 space-y-1">
        <li><strong>Email:</strong> privacy@therailexchange.com</li>
        <li><strong>Contact Form:</strong> <a href="/contact" className="text-rail-orange hover:underline">/contact</a></li>
      </ul>
    </main>
  );
}
