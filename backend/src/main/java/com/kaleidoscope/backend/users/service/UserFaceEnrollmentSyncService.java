package com.kaleidoscope.backend.users.service;

public interface UserFaceEnrollmentSyncService {
    void upsertKnownFace(Long userId, float[] faceEmbedding);
}
