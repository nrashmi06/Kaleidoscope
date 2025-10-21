
package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

/**
 * Mapper for MediaAssetTracker entity
 * Migrated from ImageStorageServiceImpl.generateUploadSignatures
 */
@Component
public class MediaAssetTrackerMapper {

    /**
     * Create MediaAssetTracker entity in PENDING state
     * Migrated from ImageStorageServiceImpl.generateUploadSignatures
     */
    public static MediaAssetTracker toEntity(String publicId, User user, String contentType) {
        return MediaAssetTracker.builder()
                .publicId(publicId)
                .user(user)
                .contentType(contentType)
                .contentId(null)
                .status(MediaAssetStatus.PENDING)
                .build();
    }
}
