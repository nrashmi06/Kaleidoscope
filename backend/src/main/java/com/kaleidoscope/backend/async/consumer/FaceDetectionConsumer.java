package com.kaleidoscope.backend.async.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.FaceDetectionResultDTO;
import com.kaleidoscope.backend.async.exception.async.BboxParsingException;
import com.kaleidoscope.backend.async.exception.async.MediaAiInsightsNotFoundException;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.async.exception.async.StreamMessageProcessingException;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.posts.model.MediaAiInsights;
import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.repository.MediaAiInsightsRepository;
import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class FaceDetectionConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;
    private final MediaAiInsightsRepository mediaAiInsightsRepository;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        try {
            log.info("Received face detection message from Redis Stream: streamKey={}, messageId={}", 
                    record.getStream(), messageId);

            // Deserialization: Convert the incoming MapRecord message into FaceDetectionResultDTO
            FaceDetectionResultDTO resultDTO = convertMapRecordToDTO(record);
            log.info("Successfully deserialized face detection for mediaId: {}, bbox: {}", 
                    resultDTO.getMediaId(), resultDTO.getBbox());

            // Data Retrieval: Find the corresponding MediaAiInsights entity using the mediaId
            MediaAiInsights mediaAiInsights = mediaAiInsightsRepository.findById(resultDTO.getMediaId())
                    .orElseThrow(() -> {
                        log.error("MediaAiInsights not found for mediaId: {}", resultDTO.getMediaId());
                        return new MediaAiInsightsNotFoundException(resultDTO.getMediaId());
                    });
            log.info("Retrieved MediaAiInsights for mediaId: {}, postId: {}", 
                    mediaAiInsights.getMediaId(), mediaAiInsights.getPost().getPostId());

            // Create and save MediaDetectedFace entity
            MediaDetectedFace detectedFace = createMediaDetectedFaceEntity(resultDTO, mediaAiInsights);
            MediaDetectedFace savedFace = mediaDetectedFaceRepository.save(detectedFace);
            log.info("Saved MediaDetectedFace for mediaId: {}, faceId: {}, status: {}", 
                    mediaAiInsights.getMediaId(), savedFace.getId(), savedFace.getStatus());

            log.info("Successfully processed face detection for mediaId: {} and messageId: {} - created face record with ID: {}",
                    resultDTO.getMediaId(), messageId, savedFace.getId());

        } catch (MediaAiInsightsNotFoundException | StreamDeserializationException | BboxParsingException e) {
            log.error("Error processing face detection message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw e; // Re-throw specific exceptions to prevent XACK
        } catch (Exception e) {
            log.error("Unexpected error processing face detection message from Redis Stream: messageId={}, error={}. Message will remain in PEL.",
                    messageId, e.getMessage(), e);
            throw new StreamMessageProcessingException(record.getStream(), messageId,
                    "Unexpected error during face detection processing", e);
        }
    }

    private FaceDetectionResultDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> recordValue = record.getValue();
            log.debug("Converting MapRecord to FaceDetectionResultDTO with {} fields", recordValue.size());

            return FaceDetectionResultDTO.builder()
                    .mediaId(Long.parseLong(recordValue.get("mediaId")))
                    .bbox(parseIntegerList(recordValue.get("bbox")))
                    .embedding(recordValue.get("embedding"))
                    .build();
        } catch (BboxParsingException e) {
            throw e; // Re-throw BboxParsingException as-is
        } catch (Exception e) {
            log.error("Failed to convert MapRecord to FaceDetectionResultDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(record.getStream(), record.getId().getValue(),
                    "Failed to deserialize face detection message", e);
        }
    }

    private List<Integer> parseIntegerList(String value) {
        if (value == null || value.trim().isEmpty()) {
            log.warn("Empty bbox value received");
            return List.of();
        }
        
        try {
            // Handle JSON array format: [x, y, width, height]
            if (value.startsWith("[") && value.endsWith("]")) {
                List<String> stringList = objectMapper.readValue(value, List.class);
                return stringList.stream()
                        .map(Integer::parseInt)
                        .collect(Collectors.toList());
            }
            
            // Handle comma-separated format: "x,y,width,height"
            String[] parts = value.split(",");
            return java.util.Arrays.stream(parts)
                    .map(String::trim)
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Failed to parse bbox coordinates: {}, error: {}", value, e.getMessage());
            throw new BboxParsingException(value, e);
        }
    }

    private MediaDetectedFace createMediaDetectedFaceEntity(FaceDetectionResultDTO resultDTO, MediaAiInsights mediaAiInsights) {
        log.debug("Creating MediaDetectedFace entity for mediaId: {}", resultDTO.getMediaId());

        // Convert List<Integer> to Integer[] for the entity
        Integer[] bboxArray = resultDTO.getBbox() != null ? 
                resultDTO.getBbox().toArray(new Integer[0]) : new Integer[0];

        return MediaDetectedFace.builder()
                .mediaAiInsights(mediaAiInsights)
                .bbox(bboxArray)
                .embedding(resultDTO.getEmbedding())
                .status(FaceDetectionStatus.UNIDENTIFIED)
                .build();
    }
}
