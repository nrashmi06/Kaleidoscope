package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for managing locations
 */
public interface LocationService {

    /**
     * Create a new location
     *
     * @param locationRequestDTO the location data
     * @return the created location
     */
    LocationResponseDTO createLocation(LocationRequestDTO locationRequestDTO);

    /**
     * Search locations across all fields (name, city, state, country, address)
     * Uses PostgreSQL full-text search for optimal performance
     *
     * @param searchTerm the search term to look for
     * @param pageable pagination parameters
     * @return paginated list of matching locations
     */
    Page<LocationResponseDTO> searchLocations(String searchTerm, Pageable pageable);

    /**
     * Find nearby locations within a specified radius
     *
     * @param latitude the latitude of the center point
     * @param longitude the longitude of the center point
     * @param radiusKm the search radius in kilometers
     * @param pageable pagination parameters
     * @return paginated list of nearby locations
     */
    Page<LocationResponseDTO> findNearbyLocations(double latitude, double longitude, double radiusKm, Pageable pageable);

    /**
     * Get location by ID
     *
     * @param locationId the ID of the location to retrieve
     * @return the location
     */
    LocationResponseDTO getLocationById(Long locationId);
}
