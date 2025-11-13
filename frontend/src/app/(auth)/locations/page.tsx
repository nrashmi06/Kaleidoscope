"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WorldMap } from "@/components/ui/world-map";
import { searchLocationsController } from "@/controllers/locationController/getAllLocations";
import { useAccessToken } from "@/hooks/useAccessToken";
import { Location } from "@/lib/types/post"; 
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { motion } from "framer-motion"; 

import { PostFeedGrid } from "@/components/feed/PostFeedGrid";
import { getPostsController } from "@/controllers/postController/getPostsController";
import { NormalizedPostFeedItem } from "@/lib/types/postFeed";


type MapPoint = {
  lat: number;
  lng: number;
  label: string;
};

export default function LocationsPage() {
  const accessToken = useAccessToken();
  
  const [locations, setLocations] = useState<Location[]>([]); 
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await searchLocationsController(accessToken, '', 0, 500); 
        
        if (res.success && res.data?.content) {
          // ✅ Set the full location objects
          setLocations(res.data.content);
        } else {
          throw new Error(res.errors?.[0] || "Failed to load locations");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [accessToken]);

  const fetchPostsForLocation = useCallback(async (locationId: number) => {
    if (!accessToken) return;
    
    setIsPostsLoading(true);
    setPostsError(null);
    setPosts([]); // Clear previous posts
    
    try {
      const result = await getPostsController(accessToken, { 
        locationId: locationId, // Filter by locationId
        page: 0,
        size: 50, // Show up to 50 posts
        sort: ["createdAt,desc"]
      });
      
      if (result.success) {
        setPosts(result.posts);
      } else {
        setPostsError(result.error || "Failed to load posts for this location.");
      }
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsPostsLoading(false);
    }
  }, [accessToken]);
  // ✅ --- END NEW FUNCTION ---

  // ✅ --- UPDATED CLICK HANDLER ---
  const handlePointClick = (label: string) => {
    const clickedLoc = locations.find(loc => loc.name === label);
    if (clickedLoc) {
      setSelectedLocation(clickedLoc);
      // Trigger the post fetch
      fetchPostsForLocation(clickedLoc.locationId); 
    }
  };
  const mapPoints: MapPoint[] = locations.map((loc: Location) => ({
    lat: loc.latitude,
    lng: loc.longitude,
    label: loc.name,
  }));

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 py-10 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Interactive Location Map
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Click on any of the pulsing dots to see posts from that location.
        </p>
      </div>

      {/* Display Selected Location */}
      <div className="max-w-7xl mx-auto text-center mb-8 h-12">
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={selectedLocation.locationId} // Use ID for re-animation
            className="inline-flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              {selectedLocation.name}
            </span>
          </motion.div>
        )}
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 p-4 ">
        {isLoading && (
          <div className="aspect-[2/1] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">
              Loading locations...
            </p>
          </div>
        )}
        {error && (
          <div className="aspect-[2/1] flex items-center justify-center text-red-500">
            <AlertCircle className="w-10 h-10 mr-3" />
            <p className="text-lg">{error}</p>
          </div>
        )}
        {!isLoading && !error && (
          <WorldMap
            singlePoints={mapPoints} 
            onPointClick={handlePointClick}
            pointColor="#f59e0b" // Amber
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-12">
        {selectedLocation && (
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Posts from {selectedLocation.name}
          </motion.h2>
        )}
        
        {/* Render the grid only if a location is selected or posts are loading */}
        {(isPostsLoading || posts.length > 0 || postsError) && (
          <PostFeedGrid
            isLoading={isPostsLoading}
            error={postsError}
            posts={posts}
            accessToken={accessToken!}
            onPostDeleted={() => {
              if (selectedLocation) {
                fetchPostsForLocation(selectedLocation.locationId);
              }
            }}
            onRetry={() => {
              if (selectedLocation) {
                fetchPostsForLocation(selectedLocation.locationId);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}