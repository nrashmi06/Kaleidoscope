package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.async.service.ElasticsearchSyncTriggerService;
import com.kaleidoscope.backend.readmodels.model.KnownFaceReadModel;
import com.kaleidoscope.backend.readmodels.repository.KnownFaceReadModelRepository;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserFaceEmbedding;
import com.kaleidoscope.backend.users.repository.UserFaceEmbeddingRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserFaceEnrollmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;


@Service
@RequiredArgsConstructor
@Slf4j
public class UserFaceEnrollmentSyncServiceImpl implements UserFaceEnrollmentSyncService {

    private static final int EXPECTED_DIM = 1408;

    private final UserRepository userRepository;
    private final UserFaceEmbeddingRepository userFaceEmbeddingRepository;
    private final KnownFaceReadModelRepository knownFaceReadModelRepository;
    private final ElasticsearchSyncTriggerService elasticsearchSyncTriggerService;

    @Override
    @Transactional
    public void upsertKnownFace(Long userId, float[] faceEmbedding) {
        if (faceEmbedding == null || faceEmbedding.length == 0) {
            throw new IllegalArgumentException("faceEmbedding is empty");
        }
        if (faceEmbedding.length != EXPECTED_DIM) {
            throw new IllegalArgumentException(
                    "Invalid embedding dimension: " + faceEmbedding.length + " (expected " + EXPECTED_DIM + ")");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + userId));

        String vectorLiteral = toPgVectorLiteral(faceEmbedding);

        // 1) Base durable table: user_face_embeddings
        UserFaceEmbedding dbEmbedding = userFaceEmbeddingRepository.findByUser_UserId(userId)
                .orElse(UserFaceEmbedding.builder().user(user).isActive(true).build());
        dbEmbedding.setEmbedding(vectorLiteral);
        dbEmbedding.setIsActive(true);
        userFaceEmbeddingRepository.save(dbEmbedding);

        // 2) Read model table: read_model_known_faces
        String faceId = buildFaceId(userId); // deterministic PK
        KnownFaceReadModel knownFace = knownFaceReadModelRepository.findById(faceId)
                .orElseGet(KnownFaceReadModel::new);
        knownFace.setFaceId(faceId);
        knownFace.setUserId(userId);
        knownFace.setUsername(user.getUsername());
        knownFace.setDepartment(user.getDesignation());
        knownFace.setProfilePicUrl(user.getProfilePictureUrl());
        knownFace.setFaceEmbedding(vectorLiteral);
        knownFace.setEnrolledAt(Instant.now());
        knownFace.setIsActive(true);
        knownFaceReadModelRepository.save(knownFace);

        // 3) Push to AI es_sync pipeline (known_faces_index)
        elasticsearchSyncTriggerService.triggerSync("read_model_known_faces", faceId);

        log.info("Known face upserted and sync triggered: userId={}, faceId={}", userId, faceId);
    }

    private String buildFaceId(Long userId) {
        return "user-" + userId;
    }

    private String toPgVectorLiteral(float[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            sb.append(values[i]);
            if (i < values.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

}
