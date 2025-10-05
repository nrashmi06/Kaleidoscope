package com.kaleidoscope.backend.shared.controller.api;

import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Location", description = "APIs for managing locations")
public interface LocationApi {

    @Operation(summary = "Search locations", description = "Search locations across name, city, state, country, and address fields. If no search term is provided, returns all locations with pagination.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Locations retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<PaginatedResponse<LocationResponseDTO>>> searchLocations(
            @Parameter(description = "Search term to find locations (searches across name, city, state, country, address)", example = "San Francisco")
            @RequestParam(required = false) String search,
            @Parameter(description = "Pagination parameters") Pageable pageable);

    @Operation(summary = "Create a new location", description = "Creates a new location.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Location created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Location already exists")
    })
    ResponseEntity<ApiResponse<LocationResponseDTO>> createLocation(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Location data to create", required = true,
                    content = @Content(schema = @Schema(implementation = LocationRequestDTO.class)))
            @Valid @RequestBody LocationRequestDTO locationRequestDTO);

    @Operation(summary = "Get location by ID", description = "Retrieves a location by its ID.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Location retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Location not found")
    })
    ResponseEntity<ApiResponse<LocationResponseDTO>> getLocationById(
            @Parameter(description = "The ID of the location to retrieve", required = true)
            @PathVariable Long locationId);

    @Operation(summary = "Find nearby locations", description = "Find locations within a specified radius from given coordinates.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Nearby locations retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid coordinates or radius"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<PaginatedResponse<LocationResponseDTO>>> findNearbyLocations(
            @Parameter(description = "Latitude of the center point", example = "37.7749", required = true)
            @RequestParam double latitude,
            @Parameter(description = "Longitude of the center point", example = "-122.4194", required = true)
            @RequestParam double longitude,
            @Parameter(description = "Search radius in kilometers", example = "10.0", required = true)
            @RequestParam double radiusKm,
            @Parameter(description = "Pagination parameters") Pageable pageable);

    @Operation(summary = "Delete location by ID", description = "Deletes a location by its ID. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Location deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Location not found")
    })
    ResponseEntity<ApiResponse<Void>> deleteLocationById(
            @Parameter(description = "The ID of the location to delete", required = true)
            @PathVariable Long locationId);
}
