package com.kaleidoscope.backend.shared.service.impl;

import com.kaleidoscope.backend.shared.dto.request.LocationRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.LocationResponseDTO;
import com.kaleidoscope.backend.shared.exception.locationException.LocationAlreadyExistsException;
import com.kaleidoscope.backend.shared.exception.locationException.LocationNotFoundException;
import com.kaleidoscope.backend.shared.mapper.LocationMapper;
import com.kaleidoscope.backend.shared.model.Location;
import com.kaleidoscope.backend.shared.repository.LocationRepository;
import com.kaleidoscope.backend.shared.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final LocationMapper locationMapper;

    @Override
    @Transactional
    public LocationResponseDTO createLocation(LocationRequestDTO locationRequestDTO) {
        if (locationRequestDTO.placeId() != null &&
                locationRepository.findByPlaceId(locationRequestDTO.placeId()).isPresent()) {
            throw new LocationAlreadyExistsException("place ID", locationRequestDTO.placeId());
        }
        if (locationRepository.findByCoordinates(locationRequestDTO.latitude(), locationRequestDTO.longitude()).isPresent()) {
            throw new LocationAlreadyExistsException("coordinates", locationRequestDTO.latitude() + ", " + locationRequestDTO.longitude());
        }
        Location location = locationMapper.toEntity(locationRequestDTO);
        Location savedLocation = locationRepository.save(location);
        log.info("Created new location with ID: {}", savedLocation.getLocationId());
        return locationMapper.toDTO(savedLocation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LocationResponseDTO> searchLocations(String searchTerm, Pageable pageable) {
        log.info("Searching locations with term: '{}'", searchTerm);
        Page<Location> locationPage;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            locationPage = locationRepository.findAll(pageable);
        } else {
            locationPage = locationRepository.search(searchTerm.trim(), pageable);
        }
        return locationMapper.toDTOPage(locationPage);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LocationResponseDTO> findNearbyLocations(double latitude, double longitude, double radiusKm, Pageable pageable) {
        log.info("Finding locations near ({}, {}) within {} km", latitude, longitude, radiusKm);
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90.");
        }
        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180.");
        }
        double radiusMeters = radiusKm * 1000;
        Page<Location> locationPage = locationRepository.findNearbyLocations(latitude, longitude, radiusMeters, pageable);
        return locationMapper.toDTOPage(locationPage);
    }

    @Override
    @Transactional(readOnly = true)
    public LocationResponseDTO getLocationById(Long locationId) {
        log.info("Getting location by ID: {}", locationId);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new LocationNotFoundException(locationId));
        return locationMapper.toDTO(location);
    }

    @Override
    @Transactional
    public void deleteLocationById(Long locationId) {
        log.info("Deleting location by ID: {}", locationId);
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new LocationNotFoundException(locationId));
        locationRepository.delete(location);
        log.info("Location deleted: {}", locationId);
    }
}