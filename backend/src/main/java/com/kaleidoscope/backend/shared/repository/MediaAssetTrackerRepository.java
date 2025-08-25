package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface MediaAssetTrackerRepository extends JpaRepository<MediaAssetTracker, Long> {

    Optional<MediaAssetTracker> findByPublicId(String publicId);

    /**
     * Finds all assets that are considered orphans. An orphan is an asset that has been
     * explicitly unlinked from a post, OR one that has been in a pending state for
     * longer than the specified cutoff time.
     *
     * @param unlinkedStatus The status for explicitly unlinked assets.
     * @param pendingStatus The status for assets pending upload/association.
     * @param cutoff The timestamp before which pending assets are considered old.
     * @return A list of orphaned MediaAssetTracker entities.
     */
    @Query("SELECT t FROM MediaAssetTracker t WHERE " +
            "t.status = :unlinkedStatus OR " +
            "(t.status = :pendingStatus AND t.createdAt < :cutoff)")
    List<MediaAssetTracker> findOrphanedAssets(
            MediaAssetStatus unlinkedStatus,
            MediaAssetStatus pendingStatus,
            LocalDateTime cutoff
    );
}