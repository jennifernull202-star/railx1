/**
 * THE RAIL EXCHANGE™ — Featured Listing Example
 * 
 * A permanent, hard-coded test listing for testing the marketplace flow.
 * This is NOT mock data - it's a real example listing that demonstrates
 * all marketplace features including premium placements.
 */

export const FEATURED_LISTING_EXAMPLE = {
  _id: 'featured-example',
  slug: 'featured-example',
  title: 'EMD GP38-2 Locomotive — Fully Rebuilt, Ready to Work',
  description: `This EMD GP38-2 locomotive has been completely rebuilt to like-new condition and is ready for immediate deployment. Originally built in 1979, this unit underwent a comprehensive rebuild in 2023 including:

**Engine & Power Plant:**
- Complete 16-645E3 engine overhaul with new power assemblies
- New turbocharger and aftercooler
- Rebuilt fuel injection system
- New air compressor and governor

**Electrical System:**
- Rewound main generator and traction motors
- New battery charging system
- Upgraded LED lighting throughout
- Modern radio equipment compatible

**Running Gear:**
- Reconditioned trucks with new wheel bearings
- New brake shoes and rigging
- Rebuilt air brake system
- Fresh wheel truing

**Cab & Controls:**
- Refurbished operator cab with new seats
- Updated control stand
- New HVAC system
- Fresh paint in customer's choice of colors

This locomotive is ideal for switching operations, short line service, or industrial applications. It offers excellent fuel economy and proven reliability. Full documentation package available including rebuild records, maintenance history, and FRA compliance certificates.

**Financing available. Trade-ins considered. Delivery can be arranged.**`,

  price: {
    amount: 395000,
    currency: 'USD',
    negotiable: true,
    type: 'fixed',
  },

  category: 'locomotives',
  subcategory: 'Diesel',
  condition: 'Rebuilt',

  specifications: {
    manufacturer: 'Electro-Motive Division (EMD)',
    model: 'GP38-2',
    year: 1979,
    rebuildYear: 2023,
    horsepower: 2000,
    weight: '248,000 lbs',
    length: '59 ft 2 in',
    fuelCapacity: '2,000 gallons',
    engineType: '16-645E3',
    tractionMotors: 'D77',
    gearRatio: '62:15',
    maxSpeed: '65 mph',
    serialNumber: 'EXAMPLE-001',
  },

  features: [
    'Complete 2023 rebuild',
    'New power assemblies',
    'Rewound electrical components',
    'LED lighting upgrade',
    'Modern radio compatible',
    'Fresh paint available',
    'Full documentation',
    'FRA compliant',
  ],

  location: {
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    zip: '77001',
  },

  images: [
    {
      url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200&h=800&fit=crop',
      alt: 'EMD GP38-2 Locomotive - Front Quarter View',
      isPrimary: true,
    },
    {
      url: 'https://images.unsplash.com/photo-1527684651001-731c474bbb5a?w=1200&h=800&fit=crop',
      alt: 'EMD GP38-2 Locomotive - Side View',
      isPrimary: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=800&fit=crop',
      alt: 'Locomotive Engine Compartment',
      isPrimary: false,
    },
    {
      url: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=1200&h=800&fit=crop',
      alt: 'Locomotive Operator Cab',
      isPrimary: false,
    },
  ],

  seller: {
    _id: 'seller-example',
    name: 'Texas Rail Equipment Co.',
    company: 'Texas Rail Equipment Co.',
    email: 'sales@example.com',
    phone: '(713) 555-0199',
    verified: true,
    memberSince: '2021',
    totalListings: 24,
    responseTime: 'Usually responds within 2 hours',
  },

  // Premium Add-Ons - This is a FEATURED listing
  premiumAddOns: {
    featured: {
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    premium: {
      active: false,
    },
    elite: {
      active: false,
    },
    aiEnhanced: true,
    specSheet: true,
  },

  stats: {
    views: 1247,
    inquiries: 18,
    watchlistCount: 32,
    lastViewed: new Date().toISOString(),
  },

  status: 'active',
  isActive: true,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

// Card format for grid displays
export const FEATURED_LISTING_CARD = {
  _id: FEATURED_LISTING_EXAMPLE._id,
  slug: FEATURED_LISTING_EXAMPLE.slug,
  title: FEATURED_LISTING_EXAMPLE.title,
  price: FEATURED_LISTING_EXAMPLE.price,
  category: FEATURED_LISTING_EXAMPLE.category,
  condition: FEATURED_LISTING_EXAMPLE.condition,
  location: FEATURED_LISTING_EXAMPLE.location,
  images: FEATURED_LISTING_EXAMPLE.images,
  seller: FEATURED_LISTING_EXAMPLE.seller,
  premiumAddOns: FEATURED_LISTING_EXAMPLE.premiumAddOns,
  createdAt: FEATURED_LISTING_EXAMPLE.createdAt,
};

export default FEATURED_LISTING_EXAMPLE;
