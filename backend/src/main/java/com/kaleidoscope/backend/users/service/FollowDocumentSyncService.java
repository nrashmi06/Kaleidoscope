package com.kaleidoscope.backend.users.service;

import com.kaleidoscope.backend.users.model.Follow;

/**
 * Service interface for synchronizing FollowDocument with Elasticsearch
 */
public interface FollowDocumentSyncService {

    /**
     * Sync follow document on follow action
     *
     * @param follow The newly created follow relationship
     */
    void syncOnFollow(Follow follow);

    /**
     * Sync follow document on unfollow action
     *
     * @param followerId The follower's user ID
     * @param followingId The user being unfollowed
     */
    void syncOnUnfollow(Long followerId, Long followingId);
}

