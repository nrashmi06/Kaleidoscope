package com.kaleidoscope.backend.shared.controller.api;

import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.response.AppResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
            @ApiResponse(responseCode = "200", description = "Locations retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<AppResponse<PaginatedResponse<LocationResponseDTO>>> searchLocations(
            @Parameter(description = "Search term to find locations (searches across name, city, state, country, address)", example = "San Francisco")
            @RequestParam(required = false) String search,
            @Parameter(description = "Pagination parameters") Pageable pageable);

    @Operation(summary = "Create a new location", description = "Creates a new location.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Location created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "409", description = "Location already exists")
    })
    ResponseEntity<AppResponse<LocationResponseDTO>> createLocation(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Location data to create", required = true,
                    content = @Content(schema = @Schema(implementation = LocationRequestDTO.class)))
            @Valid @RequestBody LocationRequestDTO locationRequestDTO);

    @Operation(summary = "Get location by ID", description = "Retrieves a location by its ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Location retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Location not found")
    })
    ResponseEntity<AppResponse<LocationResponseDTO>> getLocationById(
            @Parameter(description = "The ID of the location to retrieve", required = true)
            @PathVariable Long locationId);

    @Operation(summary = "Delete location by ID", description = "Deletes a location by its ID. Admin only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Location deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AppResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Location not found")
    })
    ResponseEntity<AppResponse<Void>> deleteLocationById(
            @Parameter(description = "The ID of the location to delete", required = true)
            @PathVariable Long locationId);
}
