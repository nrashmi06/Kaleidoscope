package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.model.User;

/**
 * Service interface for synchronizing UserDocument with Elasticsearch
 */
public interface UserDocumentSyncService {

    /**
     * Sync user document on user creation (registration)
     *
     * @param user The newly created user
     */
    void syncOnUserCreation(User user);

    /**
     * Sync user document on profile update
     *
     * @param userId The user ID whose profile was updated
     */
    void syncOnProfileUpdate(Long userId);

    /**
     * Sync follower and following counts after follow/unfollow
     *
     * @param followerId The follower's user ID
     * @param followingId The user being followed/unfollowed
     * @param isFollow true for follow, false for unfollow
     */
    void syncOnFollowChange(Long followerId, Long followingId, boolean isFollow);

    /**
     * Sync user interests after adding/removing interests
     *
     * @param userId The user ID whose interests changed
     */
    void syncOnInterestChange(Long userId);

    /**
     * Sync face embedding after ML processing
     *
     * @param userId The user ID
     * @param faceEmbedding The face embedding vector from ML service
     */
    void syncOnFaceEmbeddingGeneration(Long userId, float[] faceEmbedding);

    /**
     * Sync block lists after block/unblock action.
     *
     * @param blockerId The blocker's user ID
     * @param blockedId The blocked user's ID
     * @param isBlock true for block, false for unblock
     */
    void syncOnBlockChange(Long blockerId, Long blockedId, boolean isBlock);
}
