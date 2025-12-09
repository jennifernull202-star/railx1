/**
 * THE RAIL EXCHANGE™ — Marketplace Category Page
 * 
 * Dynamic category page showing listings in a specific category.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MarketplaceCategoryClient from './client';

// Define valid categories
const CATEGORIES = {
  locomotives: {
    title: 'Locomotives',
    description: 'Browse diesel, electric, and steam locomotives for sale',
    subcategories: ['Diesel', 'Electric', 'Steam', 'Switcher', 'Road', 'Parts'],
  },
  railcars: {
    title: 'Railcars',
    description: 'Find freight cars, tank cars, hoppers, and specialty railcars',
    subcategories: ['Box Cars', 'Flat Cars', 'Gondolas', 'Hoppers', 'Tank Cars', 'Cabooses', 'Passenger'],
  },
  'track-materials': {
    title: 'Track Materials',
    description: 'Rails, ties, switches, and track components',
    subcategories: ['Rail', 'Ties', 'Switches', 'Turnouts', 'Crossings', 'Fasteners', 'Ballast'],
  },
  mow: {
    title: 'MOW Equipment',
    description: 'Maintenance of Way machinery and equipment',
    subcategories: ['Tampers', 'Ballast Regulators', 'Tie Equipment', 'Rail Equipment', 'Hi-Rail', 'Inspection'],
  },
  signals: {
    title: 'Signal Systems',
    description: 'Railway signals, detection systems, and PTC equipment',
    subcategories: ['Signals', 'Detection', 'Crossing Equipment', 'PTC', 'Communication', 'Control Systems'],
  },
  parts: {
    title: 'Parts & Components',
    description: 'Truck assemblies, couplers, brake systems, and components',
    subcategories: ['Trucks', 'Wheels', 'Couplers', 'Brakes', 'Draft Gear', 'Bearings', 'Air Systems'],
  },
};

type CategorySlug = keyof typeof CATEGORIES;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES[slug as CategorySlug];
  
  if (!category) {
    return {
      title: 'Category Not Found | THE RAIL EXCHANGE™',
    };
  }

  return {
    title: `${category.title} for Sale | THE RAIL EXCHANGE™`,
    description: category.description,
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

export default async function MarketplaceCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = CATEGORIES[slug as CategorySlug];

  if (!category) {
    notFound();
  }

  return (
    <MarketplaceCategoryClient
      slug={slug}
      category={category}
    />
  );
}
