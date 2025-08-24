package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.Location;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    Optional<Location> findByPlaceId(String placeId);

    @Query("SELECT l FROM Location l WHERE l.latitude = :latitude AND l.longitude = :longitude")
    Optional<Location> findByCoordinates(@Param("latitude") BigDecimal latitude, @Param("longitude") BigDecimal longitude);

    @Query("SELECT l FROM Location l WHERE " +
            "l.name ILIKE %:searchTerm% OR " +
            "l.city ILIKE %:searchTerm% OR " +
            "l.state ILIKE %:searchTerm% OR " +
            "l.country ILIKE %:searchTerm% OR " +
            "l.address ILIKE %:searchTerm% " +
            "ORDER BY l.name")
    Page<Location> search(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query(value = "SELECT * FROM locations WHERE " +
            "ST_DWithin(" +
            "    ST_MakePoint(longitude, latitude)::geography, " +
            "    ST_MakePoint(:longitude, :latitude)::geography, " +
            "    :radiusMeters" +
            ")",
            nativeQuery = true)
    Page<Location> findNearbyLocations(@Param("latitude") double latitude,
                                       @Param("longitude") double longitude,
                                       @Param("radiusMeters") double radiusMeters,
                                       Pageable pageable);
}