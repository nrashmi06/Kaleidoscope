"use client";

import React, { useState, useEffect, useRef } from "react";
import { LocationOption } from "@/lib/types/post";
import { searchCombinedLocations } from "@/controllers/locationController/getAllLocations";
import { createLocationController } from "@/controllers/locationController/createLocation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationSearchProps {
  selectedLocation: LocationOption | null;
  onLocationSelect: (location: LocationOption | null) => void;
  placeholder?: string;
  className?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  selectedLocation,
  onLocationSelect,
  placeholder = "Search for a location...",
  className = "",
}) => {
  const accessToken = useAccessToken();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.trim().length > 2) {
      debounceTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const locations = await searchCombinedLocations(accessToken, query);
          setResults(locations);
          setIsOpen(true);
        } catch (error) {
          console.error('Location search error:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, accessToken]);

  const handleLocationSelect = async (location: LocationOption) => {
    isSelectingRef.current = true;

    if (location.source === 'backend') {
      onLocationSelect(location);
    } else {
      setIsCreatingLocation(true);
      try {
        const createResponse = await createLocationController(
          {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            placeId: location.placeId,
          },
          accessToken
        );

        if (createResponse.success && createResponse.data) {
          const newLocation: LocationOption = {
            ...location,
            source: 'backend',
            locationId: createResponse.data.locationId,
          };
          onLocationSelect(newLocation);
        } else {
          console.error('Failed to create location:', createResponse.errors);
        }
      } catch (error) {
        console.error('Error creating location:', error);
      } finally {
        setIsCreatingLocation(false);
      }
    }

    setQuery(location.name);
    setIsOpen(false);
    setResults([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (selectedLocation && value !== selectedLocation.name) {
      onLocationSelect(null);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-steel/50 dark:text-sky/40 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0 && !selectedLocation) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-cream-300/40 dark:border-navy-700/40 rounded-xl focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel/40 dark:focus:border-sky/40 bg-cream-50 dark:bg-navy-700/30 text-navy dark:text-cream placeholder-steel/40 dark:placeholder-sky/30 transition-all"
          disabled={isCreatingLocation}
        />
        {(isLoading || isCreatingLocation) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-steel dark:text-sky w-4 h-4 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-cream-50/95 dark:bg-navy/95 backdrop-blur-md border border-cream-300/40 dark:border-navy-700/40 rounded-xl shadow-lg shadow-navy/[0.06] dark:shadow-black/30 max-h-60 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-cream-300/40 dark:hover:bg-navy-700/40 border-b border-cream-300/20 dark:border-navy-700/20 last:border-b-0 flex items-start space-x-3 transition-colors cursor-pointer"
              disabled={isCreatingLocation}
            >
              <MapPin className="w-4 h-4 text-steel/50 dark:text-sky/40 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-navy dark:text-cream truncate">
                  {location.name}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    location.source === 'backend'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky'
                  }`}>
                    {location.source === 'backend' ? 'Saved' : 'OpenStreetMap'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLocation && (
        <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-800 dark:text-emerald-200">
              Selected: {selectedLocation.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
