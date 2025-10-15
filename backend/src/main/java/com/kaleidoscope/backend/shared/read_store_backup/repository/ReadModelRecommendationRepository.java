package com.kaleidoscope.backend.shared.read_store_backup.repository;

import com.kaleidoscope.backend.shared.read_store_backup.model.ReadModelRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReadModelRecommendationRepository extends JpaRepository<ReadModelRecommendation, Long> {
    // Vector similarity searches would typically be handled by custom native queries
    // or specialized vector database operations
}
