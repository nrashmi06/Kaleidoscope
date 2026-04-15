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
    <div className="min-h-screen w-full">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-steel/[0.06] dark:bg-steel/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/6 w-96 h-96 bg-sky/[0.06] dark:bg-sky/[0.03] rounded-full blur-[80px]" />
      </div>

      <div className="relative">
        {/* Compact header row */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-navy shadow-lg shadow-steel/25 dark:shadow-steel/15">
              <Globe2 className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-navy dark:text-cream tracking-tight">
                Explore Locations
              </h1>
              <p className="text-[11px] text-steel dark:text-sky">
                {locations.length} locations worldwide
              </p>
            </div>
          </div>

          <AnimatePresence>
            {selectedLocation && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky/15 dark:bg-sky/10 border border-sky/30 dark:border-sky/20"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-steel" />
                </span>
                <span className="text-xs font-semibold text-navy dark:text-sky">
                  {selectedLocation.name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Globe card */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="relative rounded-2xl border border-cream-300 dark:border-navy-700 bg-cream-50/60 dark:bg-navy/60 backdrop-blur-sm shadow-xl shadow-navy/[0.04] dark:shadow-black/30 overflow-hidden">
            {/* Top gradient accent line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-steel/40 to-transparent" />

            {/* Inner ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-steel/[0.03] dark:bg-sky/[0.04] rounded-full blur-[80px]" />
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-steel" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full bg-steel/20 blur-xl" />
                </div>
                <p className="text-sm text-steel dark:text-sky">
                  Loading locations...
                </p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40">
                  <AlertCircle className="w-6 h-6 text-red-500" />
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
            <div className="relative border-t border-cream-300 dark:border-navy-700 px-4 py-2.5 flex items-center justify-between text-[11px] text-steel dark:text-sky/60">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3" />
                Drag to rotate · Click a marker to explore
              </span>
              <span className="tabular-nums">{locations.length} pins</span>
            </div>
          </div>
        </div>

        {/* Posts section */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
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
                <div className="mb-6 p-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-cream-50 dark:bg-navy shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-sky/20 to-steel/15 dark:from-sky/15 dark:to-steel/10 border border-sky/30 dark:border-sky/20 flex-shrink-0">
                      <MapPin className="w-5 h-5 text-steel dark:text-sky" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display font-semibold text-navy dark:text-cream truncate text-sm">
                        {selectedLocation.name}
                      </h2>
                      <p className="text-[11px] text-steel dark:text-sky mt-0.5 tabular-nums">
                        {selectedLocation.latitude.toFixed(2)}&deg;,{" "}
                        {selectedLocation.longitude.toFixed(2)}&deg;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPostsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-steel" />
                    ) : posts.length > 0 ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky/15 dark:bg-sky/10 border border-sky/25 dark:border-sky/15 text-[11px] font-semibold text-navy dark:text-sky">
                        <ImageIcon className="w-3 h-3" />
                        {posts.length} {posts.length === 1 ? "post" : "posts"}
                      </div>
                    ) : null}
                    {role === "ADMIN" && (
                      <button
                        onClick={() => handleDeleteLocation(selectedLocation)}
                        className="p-1.5 rounded-lg text-red-500 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                        title="Delete location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search mode toggle */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSearchMode("exact");
                        fetchPostsForLocation(selectedLocation.locationId, "exact");
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        searchMode === "exact"
                          ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                          : "text-navy/70 dark:text-cream/60 bg-cream-50/60 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                      }`}
                    >
                      Exact Location
                    </button>
                    <button
                      onClick={() => {
                        setSearchMode("nearby");
                        fetchPostsForLocation(selectedLocation.locationId, "nearby", radiusKm);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        searchMode === "nearby"
                          ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                          : "text-navy/70 dark:text-cream/60 bg-cream-50/60 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
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
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-cream-300 dark:bg-navy-700 border border-cream-400 dark:border-navy-600 mb-3">
                    <MapPin className="w-5 h-5 text-steel dark:text-sky" />
                  </div>
                  <p className="text-xs text-steel dark:text-sky/60">
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
