package com.kaleidoscope.backend.shared.scheduler;

import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.repository.MediaAssetTrackerRepository;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MediaAssetCleanupScheduler {
    private final MediaAssetTrackerRepository trackerRepository;
    private final ImageStorageService imageStorageService;

    // Runs once every hour.
    @Scheduled(fixedRate = 60 * 60 * 1000)
    @Transactional
    public void cleanupOrphanedMediaAssets() {
        log.info("Starting orphaned media asset cleanup job...");

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<MediaAssetTracker> orphans = trackerRepository.findOrphanedAssets(
                MediaAssetStatus.UNLINKED,
                MediaAssetStatus.PENDING,
                cutoff
        );

        if (orphans.isEmpty()) {
            log.info("No orphaned media assets found to clean up.");
            return;
        }

        log.info("Found {} orphaned media assets to clean up.", orphans.size());
        for (MediaAssetTracker tracker : orphans) {
            try {
                imageStorageService.deleteImageByPublicId(tracker.getPublicId());
                trackerRepository.delete(tracker);
                log.info("Cleaned up orphaned media asset with public_id: {}", tracker.getPublicId());
            } catch (Exception e) {
                log.error("Failed to clean up media asset {}: {}", tracker.getPublicId(), e.getMessage());
            }
        }
        log.info("Orphaned media asset cleanup job finished.");
    }
}