package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    
    Optional<Location> findByName(String name);
    
    Optional<Location> findByPlaceId(String placeId);
    
    List<Location> findByCountry(String country);
    
    List<Location> findByState(String state);
    
    List<Location> findByCity(String city);
    
    List<Location> findByCountryAndState(String country, String state);
    
    List<Location> findByCountryAndStateAndCity(String country, String state, String city);
    
    @Query("SELECT l FROM Location l WHERE l.latitude = :latitude AND l.longitude = :longitude")
    Optional<Location> findByCoordinates(@Param("latitude") BigDecimal latitude, @Param("longitude") BigDecimal longitude);
    
    @Query("SELECT l FROM Location l WHERE " +
           "(:country IS NULL OR l.country = :country) AND " +
           "(:state IS NULL OR l.state = :state) AND " +
           "(:city IS NULL OR l.city = :city)")
    List<Location> findByLocationFilters(@Param("country") String country, 
                                       @Param("state") String state, 
                                       @Param("city") String city);
    
    @Query("SELECT l FROM Location l WHERE l.name LIKE %:keyword% OR l.city LIKE %:keyword% OR l.state LIKE %:keyword% OR l.country LIKE %:keyword%")
    List<Location> searchByKeyword(@Param("keyword") String keyword);
    
    boolean existsByPlaceId(String placeId);
}
