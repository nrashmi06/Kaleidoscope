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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
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
    if (location.source === 'backend') {
      // Backend location already has locationId
      onLocationSelect(location);
    } else {
      // Nominatim location - need to create in backend first
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (selectedLocation && value !== selectedLocation.name) {
      onLocationSelect(null); // Clear selection if user types something different
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isCreatingLocation}
        />
        {(isLoading || isCreatingLocation) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-start space-x-3"
              disabled={isCreatingLocation}
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {location.name}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    location.source === 'backend' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              Selected: {selectedLocation.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
