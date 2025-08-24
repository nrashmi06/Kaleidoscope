package com.kaleidoscope.backend.shared.controller;

import com.kaleidoscope.backend.shared.controller.api.LocationApi;
import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.dto.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.routes.LocationRoutes;
import com.kaleidoscope.backend.shared.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@Slf4j
public class LocationController implements LocationApi {

    private final LocationService locationService;

    @Override
    @GetMapping(LocationRoutes.SEARCH_LOCATIONS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<LocationResponseDTO>>> searchLocations(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        log.info("Searching locations with term: '{}' and pagination: page {}, size {}",
                search, pageable.getPageNumber(), pageable.getPageSize());
        Page<LocationResponseDTO> locations = locationService.searchLocations(search, pageable);
        PaginatedResponse<LocationResponseDTO> paginated = PaginatedResponse.fromPage(locations);
        return ResponseEntity.ok(
                ApiResponse.<PaginatedResponse<LocationResponseDTO>>builder()
                        .success(true)
                        .message(search != null && !search.trim().isEmpty()
                                ? "Locations found for search term: '" + search + "'"
                                : "All locations retrieved successfully")
                        .data(paginated)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(LocationRoutes.SEARCH_LOCATIONS)
                        .build()
        );
    }

    @Override
    @PostMapping(LocationRoutes.CREATE_LOCATION)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LocationResponseDTO>> createLocation(
            @Valid @RequestBody LocationRequestDTO locationRequestDTO) {
        
        log.info("Creating new location: {}", locationRequestDTO.getName());
        
        LocationResponseDTO createdLocation = locationService.createLocation(locationRequestDTO);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<LocationResponseDTO>builder()
                        .success(true)
                        .message("Location created successfully")
                        .data(createdLocation)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(LocationRoutes.CREATE_LOCATION)
                        .build()
        );
    }

    @Override
    @GetMapping(LocationRoutes.GET_LOCATION_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LocationResponseDTO>> getLocationById(
            @PathVariable Long locationId) {
        
        log.info("Getting location by ID: {}", locationId);
        
        LocationResponseDTO location = locationService.getLocationById(locationId);

        return ResponseEntity.ok(
                ApiResponse.<LocationResponseDTO>builder()
                        .success(true)
                        .message("Location retrieved successfully")
                        .data(location)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(LocationRoutes.GET_LOCATION_BY_ID)
                        .build()
        );
    }

    @Override
    @GetMapping(LocationRoutes.NEARBY_LOCATIONS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginatedResponse<LocationResponseDTO>>> findNearbyLocations(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam double radiusKm,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {

        log.info("Finding nearby locations at coordinates: {}, {} within {} km radius",
                latitude, longitude, radiusKm);

        Page<LocationResponseDTO> nearbyLocations = locationService.findNearbyLocations(latitude, longitude, radiusKm, pageable);
        PaginatedResponse<LocationResponseDTO> paginated = PaginatedResponse.fromPage(nearbyLocations);
        return ResponseEntity.ok(
                ApiResponse.<PaginatedResponse<LocationResponseDTO>>builder()
                        .success(true)
                        .message(String.format("Found nearby locations within %.1f km of coordinates (%.4f, %.4f)",
                                radiusKm, latitude, longitude))
                        .data(paginated)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(LocationRoutes.NEARBY_LOCATIONS)
                        .build()
        );
    }

    @Override
    @DeleteMapping(LocationRoutes.DELETE_LOCATION)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLocationById(@PathVariable Long locationId) {
        log.info("Admin deleting location by ID: {}", locationId);
        locationService.deleteLocationById(locationId);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Location deleted successfully")
                        .data(null)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(LocationRoutes.DELETE_LOCATION)
                        .build()
        );
    }
}
