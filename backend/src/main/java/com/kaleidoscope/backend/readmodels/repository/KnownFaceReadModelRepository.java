package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.KnownFaceReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnownFaceReadModelRepository extends JpaRepository<KnownFaceReadModel, String> {
    Optional<KnownFaceReadModel> findByUserId(Long userId);
}
