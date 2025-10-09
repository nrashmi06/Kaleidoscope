package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record LocationRequestDTO(
    @NotBlank(message = "Location name is required")
    @Size(max = 255, message = "Location name must not exceed 255 characters")
    String name,

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    BigDecimal latitude,

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    BigDecimal longitude,

    @Size(max = 100, message = "Country must not exceed 100 characters")
    String country,

    @Size(max = 100, message = "State must not exceed 100 characters")
    String state,

    @Size(max = 100, message = "City must not exceed 100 characters")
    String city,

    String address,

    @Size(max = 255, message = "Place ID must not exceed 255 characters")
    String placeId
) {
}
