package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MediaAssetTrackerRepository extends JpaRepository<MediaAssetTracker, Long> {
    Optional<MediaAssetTracker> findByPublicId(String publicId);
    List<MediaAssetTracker> findByUser_UserId(Long userId);
    List<MediaAssetTracker> findByPost_PostId(Long postId);
    List<MediaAssetTracker> findByStatus(com.kaleidoscope.backend.shared.enums.MediaAssetStatus status);
}

