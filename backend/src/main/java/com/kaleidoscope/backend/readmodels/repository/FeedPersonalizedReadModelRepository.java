package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.FeedPersonalizedReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedPersonalizedReadModelRepository extends JpaRepository<FeedPersonalizedReadModel, Long> {
}

