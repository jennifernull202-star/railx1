/**
 * THE RAIL EXCHANGE™ — Contractor Map Component
 * 
 * Interactive map showing contractor locations with filters and cards.
 * Features markers, clustering, and sidebar contractor list.
 * 
 * 📍 MAP VISIBILITY RULES (LOCKED):
 * ✅ Verified Contractors/Companies: ALWAYS shown (Professional Plan)
 * ❌ Buyers: NEVER shown
 * 
 * See /src/lib/map-visibility.ts for full rules.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapWrapper } from './MapWrapper';
import { ContractorCard } from '@/components/cards/ContractorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { filterContractorsForMap } from '@/lib/map-visibility';

export interface ContractorMapItem {
  id: string;
  businessName: string;
  businessDescription?: string;
  logo?: string;
  services: string[];
  contractorTypes?: string[];
  regionsServed: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  visibilityTier?: 'none' | 'verified' | 'featured' | 'priority' | 'professional';
  verifiedBadgePurchased?: boolean;
  yearsInBusiness?: number;
  isActive?: boolean;
  isPublished?: boolean;
  location: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
}

export interface ContractorMapProps {
  contractors: ContractorMapItem[];
  serviceOptions?: Array<{ value: string; label: string }>;
  contractorTypeOptions?: Array<{ value: string; label: string }>;
  onContractorSelect?: (id: string) => void;
  onFilterChange?: (filters: { service?: string; contractorType?: string; location?: string; verifiedOnly?: boolean }) => void;
  className?: string;
}

const ContractorMap: React.FC<ContractorMapProps> = ({
  contractors,
  serviceOptions = [],
  contractorTypeOptions = [],
  onContractorSelect,
  onFilterChange,
  className,
}) => {
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState({
    service: '',
    contractorType: '',
    location: '',
    verifiedOnly: false,
  });
  const [viewMode, setViewMode] = React.useState<'split' | 'map' | 'list'>('split');
  const markersRef = React.useRef<google.maps.Marker[]>([]);

  // Filter contractors for display
  const filteredContractors = React.useMemo(() => {
    return contractors.filter((contractor) => {
      // Filter by legacy service
      if (filters.service && !contractor.services.includes(filters.service)) {
        return false;
      }
      // Filter by new contractor type
      if (filters.contractorType && (!contractor.contractorTypes || !contractor.contractorTypes.includes(filters.contractorType))) {
        return false;
      }
      if (filters.verifiedOnly && contractor.verificationStatus !== 'verified') {
        return false;
      }
      if (filters.location) {
        const loc = `${contractor.location.city} ${contractor.location.state}`.toLowerCase();
        if (!loc.includes(filters.location.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [contractors, filters]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP VISIBILITY FILTER (LOCKED RULES)
  // Contractors/Companies: Must be verified + Professional Plan
  // ═══════════════════════════════════════════════════════════════════════════
  const mapEligibleContractors = React.useMemo(() => {
    // Apply user filters first, then map visibility rules
    return filterContractorsForMap(filteredContractors);
  }, [filteredContractors]);

  // Update map markers — ONLY for map-eligible contractors
  React.useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers — ONLY for map-eligible contractors (visibility rules enforced)
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocations = false;

    mapEligibleContractors.forEach((contractor) => {
      if (contractor.location.lat && contractor.location.lng) {
        hasValidLocations = true;
        const position = {
          lat: contractor.location.lat,
          lng: contractor.location.lng,
        };

        bounds.extend(position);

        const isVerified = contractor.verificationStatus === 'verified' && contractor.verifiedBadgePurchased;
        const isPriority = contractor.visibilityTier === 'priority';
        const isFeatured = contractor.visibilityTier === 'featured';
        
        // Marker color based on visibility tier
        const markerColor = isPriority ? '#EAB308' : isFeatured ? '#FF6A1A' : isVerified ? '#10B981' : '#6B7280';
        
        const marker = new google.maps.Marker({
          position,
          map,
          title: contractor.businessName,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isPriority ? 12 : isFeatured ? 11 : 10,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: isPriority ? 100 : isFeatured ? 50 : 10,
        });

        marker.addListener('click', () => {
          setSelectedId(contractor.id);
          onContractorSelect?.(contractor.id);
        });

        markersRef.current.push(marker);
      }
    });

    if (hasValidLocations && markersRef.current.length > 1) {
      map.fitBounds(bounds, 50);
    }
  }, [map, mapEligibleContractors, onContractorSelect]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleContractorClick = (id: string) => {
    setSelectedId(id);
    onContractorSelect?.(id);

    // Center map on contractor
    const contractor = contractors.find(c => c.id === id);
    if (map && contractor?.location.lat && contractor?.location.lng) {
      map.panTo({ lat: contractor.location.lat, lng: contractor.location.lng });
      map.setZoom(12);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Filters Bar */}
      <div className="bg-white border-b border-surface-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Service Filter (Legacy) */}
          <Select value={filters.service} onValueChange={(v) => handleFilterChange('service', v)}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Services</SelectItem>
              {serviceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Contractor Type Filter (New) */}
          {contractorTypeOptions.length > 0 && (
            <Select value={filters.contractorType} onValueChange={(v) => handleFilterChange('contractorType', v)}>
              <SelectTrigger className="w-48 h-10">
                <SelectValue placeholder="All Contractor Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Contractor Types</SelectItem>
                {contractorTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Verified Only Toggle */}
          <Button
            variant={filters.verifiedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('verifiedOnly', !filters.verifiedOnly)}
            className={cn(
              "h-10",
              filters.verifiedOnly && "bg-status-success hover:bg-status-success/90"
            )}
          >
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified Only
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border border-surface-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('split')}
              className={cn("rounded-none h-10", viewMode === 'split' && "bg-surface-secondary")}
            >
              Split
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('map')}
              className={cn("rounded-none h-10", viewMode === 'map' && "bg-surface-secondary")}
            >
              Map
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn("rounded-none h-10", viewMode === 'list' && "bg-surface-secondary")}
            >
              List
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-text-secondary mt-3">
          {filteredContractors.length} contractor{filteredContractors.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Contractor List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={cn(
            "bg-surface-secondary overflow-y-auto",
            viewMode === 'split' ? "w-96 border-r border-surface-border" : "flex-1"
          )}>
            <div className={cn(
              "p-4 space-y-3",
              viewMode === 'list' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            )}>
              {filteredContractors.map((contractor) => (
                <div
                  key={contractor.id}
                  onClick={() => handleContractorClick(contractor.id)}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedId === contractor.id && "ring-2 ring-rail-orange rounded-xl"
                  )}
                >
                  <ContractorCard
                    id={contractor.id}
                    businessName={contractor.businessName}
                    businessDescription={contractor.businessDescription}
                    logo={contractor.logo}
                    services={contractor.services}
                    regionsServed={contractor.regionsServed}
                    verificationStatus={contractor.verificationStatus}
                    verifiedBadgePurchased={contractor.verifiedBadgePurchased}
                    yearsInBusiness={contractor.yearsInBusiness}
                    location={contractor.location}
                  />
                </div>
              ))}
              {filteredContractors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-text-secondary">No contractors match your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1">
            <MapWrapper
              onMapLoad={setMap}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { ContractorMap };
