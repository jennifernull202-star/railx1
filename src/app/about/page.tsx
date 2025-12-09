import React from "react";

export const metadata = {
  title: "About Us | The Rail Exchange™",
  description:
    "Learn about The Rail Exchange™ — the modern marketplace for rail equipment, materials, services, and verified contractors.",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-slate-900 mb-6">
        About The Rail Exchange™
      </h1>
      <p className="text-slate-600 leading-relaxed mb-8">
        The Rail Exchange™ is the industry&apos;s first modern digital marketplace
        built exclusively for the rail sector. We connect buyers, sellers, and
        contractors in one trusted platform designed to streamline equipment
        sales, material sourcing, service procurement, and professional
        partnerships across North America.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Our Mission
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        Our mission is to modernize the rail industry by providing a premium,
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
        fragmented tools, outdated workflows, and limited access to trusted
        professionals. Our platform brings modern technology and unified access
        to an industry that deserves better.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Our Commitment
      </h2>
      <p className="text-slate-600 leading-relaxed">
        We are committed to building a trusted, transparent ecosystem that
        supports professionals at every scale — from local contractors to major
        rail operators. Our goal is to deliver intuitive tools that reduce
        friction, enhance safety, and increase opportunity across the rail
        industry.
      </p>
    </main>
  );
}
