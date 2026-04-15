"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Globe, GlobeMarker } from "@/components/ui/globe";
import { searchLocationsController } from "@/controllers/locationController/getAllLocations";
import { deleteLocationController } from "@/controllers/location/deleteLocationController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { Location } from "@/lib/types/post";
import { Loader2, MapPin, AlertCircle, Globe2, Navigation, ImageIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";

import { PostFeedGrid } from "@/components/feed/PostFeedGrid";
import { getPostsController } from "@/controllers/postController/getPostsController";
import { NormalizedPostFeedItem } from "@/lib/types/postFeed";

export default function LocationsPage() {
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);
  const { resolvedTheme } = useTheme();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<NormalizedPostFeedItem[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"exact" | "nearby">("exact");
  const [radiusKm, setRadiusKm] = useState(5);

  useEffect(() => {
    if (!accessToken) return;
    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await searchLocationsController(accessToken, "", 0, 500);
        if (res.success && res.data?.content) setLocations(res.data.content);
        else throw new Error(res.errors?.[0] || "Failed to load locations");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, [accessToken]);

  const fetchPostsForLocation = useCallback(
    async (locationId: number, mode: "exact" | "nearby" = "exact", radius: number = 5) => {
      if (!accessToken) return;
      setIsPostsLoading(true);
      setPostsError(null);
      setPosts([]);
      try {
        const filters = mode === "nearby"
          ? { nearbyLocationId: locationId, radiusKm: radius, page: 0, size: 50, sort: ["createdAt,desc"] as string[] }
          : { locationId, page: 0, size: 50, sort: ["createdAt,desc"] as string[] };
        const result = await getPostsController(accessToken, filters);
        if (result.success) setPosts(result.posts);
        else setPostsError(result.error || "Failed to load posts for this location.");
      } catch (err) {
        setPostsError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsPostsLoading(false);
      }
    },
    [accessToken]
  );

  const handleMarkerClick = useCallback(
    (label: string) => {
      const loc = locations.find((l) => l.name === label);
      if (loc) {
        setSelectedLocation(loc);
        fetchPostsForLocation(loc.locationId, searchMode, radiusKm);
      }
    },
    [locations, fetchPostsForLocation, searchMode, radiusKm]
  );

  const handleDeleteLocation = useCallback(
    async (location: Location) => {
      if (!accessToken) return;
      const confirmed = window.confirm(
        `Are you sure you want to delete "${location.name}"? This action cannot be undone.`
      );
      if (!confirmed) return;
      const res = await deleteLocationController(accessToken, location.locationId);
      if (res.success) {
        toast.success(`Location "${location.name}" deleted successfully.`);
        setLocations((prev) => prev.filter((l) => l.locationId !== location.locationId));
        if (selectedLocation?.locationId === location.locationId) {
          setSelectedLocation(null);
          setPosts([]);
        }
      } else {
        toast.error(res.message || "Failed to delete location.");
      }
    },
    [accessToken, selectedLocation]
  );

  const globeMarkers: GlobeMarker[] = useMemo(
    () =>
      locations.map((loc) => ({
        location: [loc.latitude, loc.longitude] as [number, number],
        size: 0.03,
        label: loc.name,
      })),
    [locations]
  );

  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full">
      <div className="relative">
        {/* Header */}
        <div className="pt-6 pb-5 px-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-navy dark:text-cream tracking-tight">
                Locations
              </h1>
              <p className="mt-1 text-sm text-steel/50 dark:text-sky/35">
                {locations.length} locations worldwide
              </p>
            </div>

            <AnimatePresence>
              {selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-300/50 dark:bg-navy-700/50"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-navy/50 dark:bg-cream/50 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-navy dark:bg-cream" />
                  </span>
                  <span className="text-xs font-semibold text-navy dark:text-cream">
                    {selectedLocation.name}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Globe card */}
        <div className="w-full pb-6">
          <div className="relative rounded-2xl bg-cream-300/20 dark:bg-navy-700/20 overflow-hidden">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-navy/30 dark:text-cream/30" />
                <p className="text-sm text-navy/40 dark:text-cream/40">
                  Loading locations...
                </p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 mb-1">
                  <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {!isLoading && !error && (
              <Globe
                markers={globeMarkers}
                onMarkerClick={handleMarkerClick}
                dark={isDark}
                selectedLabel={selectedLocation?.name}
              />
            )}

            {/* Bottom bar */}
            <div className="relative border-t border-cream-300/40 dark:border-navy-700/40 px-4 py-2.5 flex items-center justify-between text-[11px] text-navy/35 dark:text-cream/30">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3" />
                Drag to rotate · Click a marker to explore
              </span>
              <span className="tabular-nums">{locations.length} pins</span>
            </div>
          </div>
        </div>

        {/* Posts section */}
        <div className="w-full pb-16">
          <AnimatePresence mode="wait">
            {selectedLocation ? (
              <motion.div
                key={selectedLocation.locationId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Location detail card */}
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-5 h-5 text-navy/40 dark:text-cream/40 flex-shrink-0" />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-navy dark:text-cream truncate text-base">
                        {selectedLocation.name}
                      </h2>
                      <p className="text-xs text-navy/35 dark:text-cream/30 mt-0.5 tabular-nums">
                        {selectedLocation.latitude.toFixed(2)}&deg;,{" "}
                        {selectedLocation.longitude.toFixed(2)}&deg;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPostsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-navy/30 dark:text-cream/30" />
                    ) : posts.length > 0 ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50 text-[11px] font-semibold text-navy/60 dark:text-cream/60">
                        <ImageIcon className="w-3 h-3" />
                        {posts.length} {posts.length === 1 ? "post" : "posts"}
                      </div>
                    ) : null}
                    {role === "ADMIN" && (
                      <button
                        onClick={() => handleDeleteLocation(selectedLocation)}
                        className="p-1.5 rounded-full text-red-500/70 hover:bg-red-500/[0.06] transition-colors cursor-pointer"
                        title="Delete location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search mode toggle — pill segmented control */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
                    <button
                      onClick={() => {
                        setSearchMode("exact");
                        fetchPostsForLocation(selectedLocation.locationId, "exact");
                      }}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                        searchMode === "exact"
                          ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                          : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                      }`}
                    >
                      Exact Location
                    </button>
                    <button
                      onClick={() => {
                        setSearchMode("nearby");
                        fetchPostsForLocation(selectedLocation.locationId, "nearby", radiusKm);
                      }}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
                        searchMode === "nearby"
                          ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                          : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                      }`}
                    >
                      Nearby Posts
                    </button>
                  </div>

                  {searchMode === "nearby" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={radiusKm}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRadiusKm(val);
                        }}
                        onMouseUp={() => {
                          fetchPostsForLocation(selectedLocation.locationId, "nearby", radiusKm);
                        }}
                        onTouchEnd={() => {
                          fetchPostsForLocation(selectedLocation.locationId, "nearby", radiusKm);
                        }}
                        className="w-28 h-1.5 accent-steel dark:accent-sky cursor-pointer"
                      />
                      <span className="text-[11px] font-semibold text-navy dark:text-cream tabular-nums min-w-[3.5rem]">
                        {radiusKm} km
                      </span>
                    </div>
                  )}
                </div>

                {(isPostsLoading || posts.length > 0 || postsError) && (
                  <PostFeedGrid
                    isLoading={isPostsLoading}
                    error={postsError}
                    posts={posts}
                    accessToken={accessToken!}
                    onPostDeleted={() => {
                      if (selectedLocation)
                        fetchPostsForLocation(selectedLocation.locationId, searchMode, radiusKm);
                    }}
                    onRetry={() => {
                      if (selectedLocation)
                        fetchPostsForLocation(selectedLocation.locationId, searchMode, radiusKm);
                    }}
                  />
                )}
              </motion.div>
            ) : (
              !isLoading &&
              !error &&
              locations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10"
                >
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-3">
                    <MapPin className="w-5 h-5 text-navy/30 dark:text-cream/30" />
                  </div>
                  <p className="text-sm text-navy/35 dark:text-cream/30">
                    Click a location on the globe to see its posts
                  </p>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
