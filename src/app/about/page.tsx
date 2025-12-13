import React from "react";

export const metadata = {
  title: "About Us | The Rail Exchange™",
  description:
    "Learn about The Rail Exchange™ — the dedicated marketplace for rail equipment, materials, services, and professional contractors.",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">
        About The Rail Exchange™
      </h1>
      <p className="text-slate-600 leading-relaxed mb-8">
        The Rail Exchange™ is a dedicated digital marketplace
        built exclusively for the rail sector. We connect buyers, sellers, and
        contractors in one industry-focused platform designed to streamline equipment
        sales, material sourcing, service procurement, and professional
        partnerships across North America.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Our Mission
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        Our mission is to support the rail industry by providing a
        centralized marketplace that simplifies discovery, improves
        transparency, and empowers professionals to buy, sell, and connect with
        confidence.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        What We Offer
      </h2>
      <ul className="space-y-4 text-slate-600 leading-relaxed mb-8">
        <li>
          <strong className="text-slate-900">Equipment Marketplace:</strong>{" "}
          Browse locomotives, rail cars, track machinery, MOW equipment, and more.
        </li>
        <li>
          <strong className="text-slate-900">Materials Marketplace:</strong>{" "}
          Source rail, fasteners, ties, ballast, and infrastructure components.
        </li>
        <li>
          <strong className="text-slate-900">Service Directory:</strong>{" "}
          Find verified contractors for maintenance, inspection, consulting, and construction.
        </li>
        <li>
          <strong className="text-slate-900">AI Tools:</strong>{" "}
          Generate professional listings, optimized descriptions, and spec sheets.
        </li>
        <li>
          <strong className="text-slate-900">Premium Add-Ons:</strong>{" "}
          Visibility boosts including Featured, Premium, and Elite placement.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Why We Built It
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        The Rail Exchange™ was created to solve a long-standing industry problem:
        fragmented tools, outdated workflows, and limited access to qualified
        professionals. Our platform brings dedicated tools and unified access
        to an industry that deserves better.
      </p>
      <p className="text-xs text-slate-500 mb-8">
        The Rail Exchange provides listing and introduction services only.
        Buyers and sellers must perform their own due diligence.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Our Commitment
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        We are committed to building a professional marketplace that
        supports professionals at every scale — from local contractors to major
        rail operators. Our goal is to deliver intuitive tools that reduce
        friction and increase opportunity across the rail industry.
      </p>

      {/* BATCH E-5: Admin Authority Boundary & No Endorsement Disclosures */}
      <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
        <p className="text-sm text-slate-500">
          Administrative actions are discretionary and based on available information at the time of review.
        </p>
        <p className="text-sm text-slate-500">
          Presence on The Rail Exchange does not constitute endorsement, recommendation, or certification by the platform.
        </p>
      </div>
    </main>
  );
}
