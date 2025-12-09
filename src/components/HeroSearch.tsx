/**
 * THE RAIL EXCHANGE™ — Hero Search Component
 * 
 * Premium search module with keyword, location, and category inputs.
 * Features Google Places Autocomplete for location.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationAutocomplete, { LocationResult } from '@/components/search/LocationAutocomplete';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'locomotives', label: 'Locomotives' },
  { value: 'freight-cars', label: 'Freight Cars' },
  { value: 'passenger-cars', label: 'Passenger Cars' },
  { value: 'maintenance-of-way', label: 'Maintenance of Way' },
  { value: 'track-materials', label: 'Track Materials' },
  { value: 'signals-communications', label: 'Signals & Communications' },
  { value: 'parts-components', label: 'Parts & Components' },
  { value: 'tools-equipment', label: 'Tools & Equipment' },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationSelect = (result: LocationResult) => {
    setCoordinates({ lat: result.lat, lng: result.lng });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    if (coordinates) {
      params.set('lat', coordinates.lat.toString());
      params.set('lng', coordinates.lng.toString());
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-2 md:p-2.5 border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search equipment, materials, services..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:bg-white transition-colors"
            />
          </div>

          {/* Location Input with Google Places Autocomplete */}
          <div className="relative lg:w-48">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              onLocationSelect={handleLocationSelect}
              placeholder="City or ZIP"
              inputClassName="pl-12 pr-4 py-3.5"
            />
          </div>

          {/* Category Select */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3.5 bg-slate-50/80 rounded-xl text-[15px] text-navy-900 font-medium focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:bg-white cursor-pointer transition-colors appearance-none lg:w-48"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              paddingRight: '40px',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Search Button */}
          <button 
            type="submit" 
            className="inline-flex items-center justify-center h-[50px] px-8 bg-rail-orange text-white text-[15px] font-semibold rounded-xl shadow-sm hover:bg-[#e55f15] hover:shadow-md transition-all duration-200"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
