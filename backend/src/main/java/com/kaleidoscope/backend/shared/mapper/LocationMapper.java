package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.model.Location;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

@Component
public class LocationMapper {

    public LocationResponseDTO toDTO(Location location) {
        if (location == null) {
            return null;
        }

        return LocationResponseDTO.builder()
                .locationId(location.getLocationId())
                .name(location.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .country(location.getCountry())
                .state(location.getState())
                .city(location.getCity())
                .address(location.getAddress())
                .placeId(location.getPlaceId())
                .createdAt(location.getCreatedAt())
                .build();
    }

    public Location toEntity(LocationRequestDTO requestDTO) {
        if (requestDTO == null) {
            return null;
        }

        return Location.builder()
                .name(requestDTO.getName())
                .latitude(requestDTO.getLatitude())
                .longitude(requestDTO.getLongitude())
                .country(requestDTO.getCountry())
                .state(requestDTO.getState())
                .city(requestDTO.getCity())
                .address(requestDTO.getAddress())
                .placeId(requestDTO.getPlaceId())
                .build();
    }

    public Page<LocationResponseDTO> toDTOPage(Page<Location> locationPage) {
        if (locationPage == null) {
            return null;
        }

        return locationPage.map(this::toDTO);
    }
}
