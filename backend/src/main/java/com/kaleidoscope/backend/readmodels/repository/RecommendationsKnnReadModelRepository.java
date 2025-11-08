package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.RecommendationsKnnReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecommendationsKnnReadModelRepository extends JpaRepository<RecommendationsKnnReadModel, Long> {
}

