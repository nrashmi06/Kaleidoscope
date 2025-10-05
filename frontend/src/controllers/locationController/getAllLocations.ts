import { AxiosError } from "axios";
import { LocationsResponse, LocationOption, NominatimLocation } from "@/lib/types/post";
import { searchLocations } from "@/services/location/getAllLocations";
import { searchNominatimLocations } from "@/services/location/nominatimSearch";

export const searchLocationsController = async (
  accessToken: string,
  query: string = '',
  page: number = 0,
  size: number = 20
): Promise<LocationsResponse> => {
  try {
    const response = await searchLocations(accessToken, query, page, size);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while searching locations.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[LocationController] Failed to search locations - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[LocationController] Unexpected error while searching locations:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to search locations.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/locations/search",
    };
  }
};

export const searchCombinedLocations = async (
  accessToken: string,
  query: string
): Promise<LocationOption[]> => {
  if (!query.trim()) {
    return [];
  }

  try {
    // Call both APIs concurrently
    const [backendResponse, nominatimResults] = await Promise.all([
      searchLocationsController(accessToken, query, 0, 10),
      searchNominatimLocations(query, 5),
    ]);

    const locationOptions: LocationOption[] = [];
    const seenPlaceIds = new Set<number>();

    // Add backend results first
    if (backendResponse.success && backendResponse.data?.content) {
      backendResponse.data.content.forEach(location => {
        locationOptions.push({
          id: `backend-${location.locationId}`,
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          source: 'backend',
          locationId: location.locationId,
        });
      });
    }

    // Add Nominatim results (deduplicated by placeId)
    nominatimResults.forEach((nominatimLocation: NominatimLocation) => {
      if (!seenPlaceIds.has(nominatimLocation.place_id)) {
        seenPlaceIds.add(nominatimLocation.place_id);
        
        locationOptions.push({
          id: `nominatim-${nominatimLocation.place_id}`,
          name: nominatimLocation.display_name,
          latitude: parseFloat(nominatimLocation.lat),
          longitude: parseFloat(nominatimLocation.lon),
          address: nominatimLocation.display_name,
          source: 'nominatim',
          placeId: nominatimLocation.place_id,
        });
      }
    });

    return locationOptions;
  } catch (error) {
    console.error('Error searching combined locations:', error);
    return [];
  }
};
