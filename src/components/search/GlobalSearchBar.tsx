/**
 * THE RAIL EXCHANGE™ — Global Search Bar Component
 * 
 * Premium search bar with autocomplete, category filter, and location.
 * Used in header and hero sections.
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface GlobalSearchBarProps {
  variant?: 'default' | 'hero' | 'compact';
  showCategoryFilter?: boolean;
  showLocationFilter?: boolean;
  categories?: Array<{ value: string; label: string }>;
  defaultValues?: {
    query?: string;
    category?: string;
    location?: string;
  };
  onSearch?: (values: { query: string; category?: string; location?: string }) => void;
  className?: string;
}

const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  variant = 'default',
  showCategoryFilter = true,
  showLocationFilter = true,
  categories = [],
  defaultValues = {},
  onSearch,
  className,
}) => {
  const router = useRouter();
  const [query, setQuery] = React.useState(defaultValues.query || '');
  const [category, setCategory] = React.useState(defaultValues.category || '');
  const [location, setLocation] = React.useState(defaultValues.location || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onSearch) {
      onSearch({ query, category, location });
    } else {
      // Build search URL
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      if (location) params.set('location', location);
      router.push(`/search?${params.toString()}`);
    }
  };

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className={cn("w-full", className)}>
        <div className="bg-white rounded-2xl shadow-xl p-2 md:p-3">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0">
            {/* Search Input */}
            <div className="flex-1 flex items-center px-4">
              <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search equipment, materials, services..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 text-base md:text-lg placeholder:text-text-tertiary"
              />
            </div>

            {/* Divider */}
            {showCategoryFilter && (
              <div className="hidden md:block w-px bg-surface-border self-stretch my-2" />
            )}

            {/* Category Filter */}
            {showCategoryFilter && (
              <div className="md:w-48 px-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-0 focus:ring-0 h-12 text-base">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Divider */}
            {showLocationFilter && (
              <div className="hidden md:block w-px bg-surface-border self-stretch my-2" />
            )}

            {/* Location Filter */}
            {showLocationFilter && (
              <div className="flex-1 md:flex-initial md:w-48 flex items-center px-4">
                <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-base placeholder:text-text-tertiary"
                />
              </div>
            )}

            {/* Search Button */}
            <Button 
              type="submit"
              className="h-12 px-8 bg-rail-orange hover:bg-rail-orange-dark text-white font-semibold rounded-xl text-base"
            >
              Search
            </Button>
          </div>
        </div>
      </form>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className={cn("w-full", className)}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 bg-rail-orange hover:bg-rail-orange-dark">
            Search
          </Button>
        </div>
      </form>
    );
  }

  // Default variant
  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Search equipment, materials, services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-lg"
          />
        </div>

        {showCategoryFilter && (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48 h-12 rounded-lg">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showLocationFilter && (
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-11 h-12 w-full sm:w-48 rounded-lg"
            />
          </div>
        )}

        <Button 
          type="submit"
          className="h-12 px-8 bg-rail-orange hover:bg-rail-orange-dark text-white font-semibold rounded-lg"
        >
          Search
        </Button>
      </div>
    </form>
  );
};

export { GlobalSearchBar };
