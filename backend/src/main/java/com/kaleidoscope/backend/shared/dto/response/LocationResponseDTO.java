package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponseDTO {

    private Long locationId;
    private String name;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String country;
    private String state;
    private String city;
    private String address;
    private String placeId;
    private LocalDateTime createdAt;
}
