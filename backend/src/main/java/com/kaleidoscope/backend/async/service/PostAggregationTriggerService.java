package com.kaleidoscope.backend.async.service;

import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service to trigger the AI Post Aggregation service.
 * This is called *after* all individual media items for a post have been processed.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PostAggregationTriggerService {

    private final RedisStreamPublisher redisStreamPublisher;

    /**
     * Publishes a message to the post-aggregation-trigger stream.
     *
     * @param postId The ID of the post that is ready for aggregation.
     * @param allMediaIds A list of all media IDs associated with this post.
     */
    public void triggerAggregation(Long postId, List<Long> allMediaIds) {
        log.info("Triggering post aggregation for postId: {} with {} media items", postId, allMediaIds.size());
        try {
            // Convert list of longs to a comma-separated string for the stream
            String mediaIdsString = allMediaIds.stream()
                                               .map(String::valueOf)
                                               .collect(Collectors.joining(","));

            Map<String, Object> message = new HashMap<>();
            message.put("postId", String.valueOf(postId));
            message.put("totalMedia", String.valueOf(allMediaIds.size()));
            message.put("allMediaIds", mediaIdsString);
            message.put("timestamp", Instant.now().toString());
            message.put("correlationId", MDC.get("correlationId")); // Pass on the correlation ID

            redisStreamPublisher.publish(
                ProducerStreamConstants.POST_AGGREGATION_TRIGGER_STREAM,
                message
            );

            log.info("Successfully published post-aggregation-trigger for postId: {}", postId);
        } catch (Exception e) {
            log.error("Failed to publish post-aggregation-trigger for postId: {}", postId, e);
            // Non-blocking error. The trigger can be retried later.
        }
    }
}

