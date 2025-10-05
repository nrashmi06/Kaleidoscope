package com.kaleidoscope.backend.ml.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.ml.dto.FaceRecognitionResultDTO;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRecognitionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        try {
            log.info("Received face recognition message from Redis Stream: streamKey={}, messageId={}", 
                    record.getStream(), record.getId());

            // Deserialization: Convert the incoming MapRecord message into FaceRecognitionResultDTO
            FaceRecognitionResultDTO resultDTO = convertMapRecordToDTO(record);
            log.info("Successfully deserialized face recognition for faceId: {}, suggestedUserId: {}, confidence: {}", 
                    resultDTO.getFaceId(), resultDTO.getSuggestedUserId(), resultDTO.getConfidenceScore());

            // Data Retrieval: Find the MediaDetectedFace entity using the faceId
            MediaDetectedFace detectedFace = mediaDetectedFaceRepository.findById(resultDTO.getFaceId())
                    .orElseThrow(() -> {
                        log.error("MediaDetectedFace not found for faceId: {}", resultDTO.getFaceId());
                        return new RuntimeException("MediaDetectedFace not found for faceId: " + resultDTO.getFaceId());
                    });
            log.info("Retrieved MediaDetectedFace for faceId: {}, mediaId: {}", 
                    detectedFace.getId(), detectedFace.getMediaAiInsights().getMediaId());

            // Find the User entity for the suggestedUserId
            User suggestedUser = userRepository.findById(resultDTO.getSuggestedUserId())
                    .orElseThrow(() -> {
                        log.error("User not found for suggestedUserId: {}", resultDTO.getSuggestedUserId());
                        return new RuntimeException("User not found for suggestedUserId: " + resultDTO.getSuggestedUserId());
                    });
            log.info("Retrieved suggested User: userId={}, username={}", 
                    suggestedUser.getUserId(), suggestedUser.getUsername());

            // Update the MediaDetectedFace entity with recognition results
            updateDetectedFaceWithRecognition(detectedFace, suggestedUser, resultDTO.getConfidenceScore());
            MediaDetectedFace updatedFace = mediaDetectedFaceRepository.save(detectedFace);
            log.info("Updated MediaDetectedFace for faceId: {}, status: {}, suggestedUser: {}, confidence: {}", 
                    updatedFace.getId(), updatedFace.getStatus(), updatedFace.getSuggestedUser().getUsername(), 
                    updatedFace.getConfidenceScore());

            log.info("Successfully processed face recognition for faceId: {} - updated with suggested user: {}", 
                    resultDTO.getFaceId(), suggestedUser.getUsername());

        } catch (Exception e) {
            log.error("Error processing face recognition message from Redis Stream: streamKey={}, messageId={}, error={}", 
                    record.getStream(), record.getId(), e.getMessage(), e);
            // Re-throw to trigger retry mechanism if configured
            throw new RuntimeException("Failed to process face recognition message", e);
        }
    }

    private FaceRecognitionResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> recordValue = record.getValue();
            log.debug("Converting MapRecord to FaceRecognitionResultDTO with {} fields", recordValue.size());

            return FaceRecognitionResultDTO.builder()
                    .faceId(Long.parseLong(recordValue.get("faceId")))
                    .suggestedUserId(Long.parseLong(recordValue.get("suggestedUserId")))
                    .confidenceScore(Double.parseDouble(recordValue.get("confidenceScore")))
                    .build();
        } catch (Exception e) {
            log.error("Failed to convert MapRecord to FaceRecognitionResultDTO: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to deserialize face recognition message", e);
        }
    }

    private void updateDetectedFaceWithRecognition(MediaDetectedFace detectedFace, User suggestedUser, Double confidenceScore) {
        log.debug("Updating MediaDetectedFace with recognition results: faceId={}, suggestedUserId={}, confidence={}", 
                detectedFace.getId(), suggestedUser.getUserId(), confidenceScore);

        // Update the detected face with suggestion details
        detectedFace.setSuggestedUser(suggestedUser);
        detectedFace.setConfidenceScore(confidenceScore.floatValue());
        detectedFace.setStatus(FaceDetectionStatus.SUGGESTED);
    }
}
