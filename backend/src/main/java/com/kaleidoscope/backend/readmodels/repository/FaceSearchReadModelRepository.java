package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.FaceSearchReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceSearchReadModelRepository extends JpaRepository<FaceSearchReadModel, Long> {

    Optional<FaceSearchReadModel> findByFaceId(String faceId);
}
