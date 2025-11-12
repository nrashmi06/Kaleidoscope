package com.kaleidoscope.backend.notifications.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaleidoscope.backend.async.dto.NotificationEventDTO;
import com.kaleidoscope.backend.async.exception.async.StreamDeserializationException;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.notifications.model.Notification;
import com.kaleidoscope.backend.notifications.repository.NotificationRepository;
import com.kaleidoscope.backend.notifications.service.NotificationSseService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.enums.NotificationType;
import com.kaleidoscope.backend.shared.model.Comment;
import com.kaleidoscope.backend.shared.repository.CommentRepository;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserNotificationPreferences;
import com.kaleidoscope.backend.users.repository.UserNotificationPreferencesRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Component // Changed from @Service for injection into RedisStreamConfig
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final ObjectMapper objectMapper;
    private final UserNotificationPreferencesRepository preferencesRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ApplicationProperties applicationProperties;
    private final CommentRepository commentRepository;
    private final NotificationSseService notificationSseService;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String UNREAD_COUNT_KEY_PATTERN = "user:%d:notifications:unseen_count";
    private static final long REDIS_TTL_HOURS = 24;

    @Override
    @Transactional
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        String streamName = record.getStream();

        log.info("==================== NOTIFICATION CONSUMER INVOKED ====================");
        log.info("Stream: {}, MessageID: {}, Thread: {}", streamName, messageId, Thread.currentThread().getName());
        log.info("Raw Record Value: {}", record.getValue());

        try {
            log.info("Received notification event from stream: {}, messageId: {}", streamName, messageId);

            // Deserialize the event
            NotificationEventDTO event = convertMapRecordToDTO(record);
            log.info("Processing notification event - type: {}, recipientUserId: {}, actorUserId: {}",
                    event.type(), event.recipientUserId(), event.actorUserId());

            // Fetch user preferences
            UserNotificationPreferences preferences = preferencesRepository.findByUserId(event.recipientUserId())
                    .orElse(null);
            
            if (preferences == null) {
                log.warn("No notification preferences found for userId: {}, skipping notification", event.recipientUserId());
                return;
            }

            // Check if any notification channel is enabled
            boolean pushEnabled = isPushEnabled(preferences, event.type());
            boolean emailEnabled = isEmailEnabled(preferences, event.type());

            if (!pushEnabled && !emailEnabled) {
                log.debug("All notification channels disabled for userId: {}, type: {}", 
                        event.recipientUserId(), event.type());
                return;
            }

            // Fetch recipient user
            User recipientUser = userRepository.findById(event.recipientUserId()).orElse(null);
            if (recipientUser == null) {
                log.error("Recipient user not found: {}", event.recipientUserId());
                return;
            }

            // Fetch actor user (optional)
            User actorUser = null;
            if (event.actorUserId() != null) {
                actorUser = userRepository.findById(event.actorUserId()).orElse(null);
            }

            // Build notification message and link
            String message = buildNotificationMessage(event, actorUser);
            String link = buildNotificationLink(event, applicationProperties.baseUrl());

            // Save notification to database if push or email is enabled
            Notification notification = Notification.builder()
                    .recipientUser(recipientUser)
                    .actorUser(actorUser)
                    .type(event.type())
                    .message(message)
                    .link(link)
                    .contentId(event.contentId())
                    .contentType(event.contentType())
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            log.info("Saved notification to database - notificationId: {}, recipientUserId: {}",
                    notification.getNotificationId(), event.recipientUserId());

            // Increment unread count in Redis and send SSE update
            String countKey = String.format(UNREAD_COUNT_KEY_PATTERN, event.recipientUserId());
            log.debug("[NotificationConsumer] Incrementing unread count in Redis for userId: {}, key: {}",
                    event.recipientUserId(), countKey);
            Long newCount = stringRedisTemplate.opsForValue().increment(countKey);

            if (newCount != null) {
                // Set TTL on the key if this is the first increment
                if (newCount == 1) {
                    stringRedisTemplate.expire(countKey, REDIS_TTL_HOURS, java.util.concurrent.TimeUnit.HOURS);
                    log.debug("[NotificationConsumer] Set TTL of {} hours on new Redis key for userId: {}",
                            REDIS_TTL_HOURS, event.recipientUserId());
                }

                // Send count update via SSE
                log.info("[NotificationConsumer] Sending SSE count update: userId={}, newCount={}, notificationType={}",
                        event.recipientUserId(), newCount, event.type());
                notificationSseService.sendCountUpdate(event.recipientUserId(), newCount);
                log.debug("[NotificationConsumer] SSE count update sent successfully for userId: {}", event.recipientUserId());
            } else {
                log.warn("[NotificationConsumer] Redis increment returned null for userId: {}, SSE update skipped",
                        event.recipientUserId());
            }

            // Send email notification if enabled
            if (emailEnabled) {
                try {
                    String emailSubject = buildEmailSubject(event.type());
                    String templateName = getEmailTemplateName(event.type());
                    Map<String, Object> emailVariables = buildEmailVariables(event, actorUser, message, link);

                    emailService.sendNotificationEmail(recipientUser.getEmail(), emailSubject, templateName, emailVariables);
                    log.info("Sent notification email to: {}, type: {}", recipientUser.getEmail(), event.type());
                } catch (Exception e) {
                    log.error("Failed to send notification email to userId: {}, type: {}", 
                            event.recipientUserId(), event.type(), e);
                }
            }

            // Handle push notification if enabled
            if (pushEnabled) {
                // TODO: Implement push notification logic
                log.info("Push notification enabled for userId: {}, type: {} (implementation pending)", 
                        event.recipientUserId(), event.type());
            }

            log.info("✅ Successfully processed notification event - messageId: {}, type: {}, recipientUserId: {}",
                    messageId, event.type(), event.recipientUserId());

        } catch (StreamDeserializationException e) {
            log.error("Error deserializing notification event from stream: {}, messageId: {}, error: {}",
                    streamName, messageId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Error processing notification event from stream: {}, messageId: {}, error: {}. Message will remain in PEL.",
                    streamName, messageId, e.getMessage(), e);
            throw e; // CRITICAL FIX: Re-throw to prevent XACK on failure and avoid data loss
        }
    }

    private NotificationEventDTO convertMapRecordToDTO(MapRecord<String, String, String> record) {
        try {
            Map<String, String> recordValue = record.getValue();
            log.debug("Converting MapRecord to NotificationEventDTO with {} fields", recordValue.size());

            NotificationType type = NotificationType.valueOf(recordValue.get("type"));
            Long recipientUserId = Long.parseLong(recordValue.get("recipientUserId"));

            // Handle empty strings for optional fields
            Long actorUserId = null;
            String actorUserIdStr = recordValue.get("actorUserId");
            if (actorUserIdStr != null && !actorUserIdStr.isEmpty() && !actorUserIdStr.equals("null")) {
                actorUserId = Long.parseLong(actorUserIdStr);
            }

            Long contentId = null;
            String contentIdStr = recordValue.get("contentId");
            if (contentIdStr != null && !contentIdStr.isEmpty() && !contentIdStr.equals("null")) {
                contentId = Long.parseLong(contentIdStr);
            }

            ContentType contentType = null;
            String contentTypeStr = recordValue.get("contentType");
            if (contentTypeStr != null && !contentTypeStr.isEmpty() && !contentTypeStr.equals("null")) {
                contentType = ContentType.valueOf(contentTypeStr);
            }

            String correlationId = recordValue.get("correlationId");

            // Parse additionalData if present - it comes as a JSON string from Redis
            Map<String, String> additionalData = null;
            String additionalDataStr = recordValue.get("additionalData");
            if (additionalDataStr != null && !additionalDataStr.isEmpty() && !additionalDataStr.equals("null")) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, String> parsedData = objectMapper.readValue(additionalDataStr, Map.class);
                    additionalData = parsedData;
                    log.debug("Parsed additionalData: {}", additionalData);
                } catch (Exception e) {
                    log.warn("Failed to parse additionalData, skipping: {}", e.getMessage());
                }
            }

            return new NotificationEventDTO(type, recipientUserId, actorUserId, contentId, contentType, additionalData, correlationId);

        } catch (Exception e) {
            log.error("Failed to convert MapRecord to NotificationEventDTO: {}", e.getMessage(), e);
            throw new StreamDeserializationException(record.getStream(), record.getId().getValue(),
                    "Failed to deserialize notification event message", e);
        }
    }

    private boolean isPushEnabled(UserNotificationPreferences prefs, NotificationType type) {
        return switch (type) {
            case NEW_COMMENT -> Boolean.TRUE.equals(prefs.getCommentsPush());
            case NEW_FOLLOWER -> Boolean.TRUE.equals(prefs.getFollowsPush());
            case FOLLOW_REQUEST -> Boolean.TRUE.equals(prefs.getFollowRequestPush());
            case FOLLOW_ACCEPT -> Boolean.TRUE.equals(prefs.getFollowAcceptPush());
            case MENTION_POST, MENTION_COMMENT -> Boolean.TRUE.equals(prefs.getMentionsPush());
            case NEW_REACTION_POST, NEW_REACTION_COMMENT -> Boolean.TRUE.equals(prefs.getLikesPush());
            case SYSTEM_MESSAGE -> Boolean.TRUE.equals(prefs.getSystemPush());
        };
    }

    private boolean isEmailEnabled(UserNotificationPreferences prefs, NotificationType type) {
        return switch (type) {
            case NEW_COMMENT -> Boolean.TRUE.equals(prefs.getCommentsEmail());
            case NEW_FOLLOWER -> Boolean.TRUE.equals(prefs.getFollowsEmail());
            case FOLLOW_REQUEST, FOLLOW_ACCEPT -> Boolean.TRUE.equals(prefs.getFollowsEmail());
            case MENTION_POST, MENTION_COMMENT -> Boolean.TRUE.equals(prefs.getMentionsEmail());
            case NEW_REACTION_POST, NEW_REACTION_COMMENT -> Boolean.TRUE.equals(prefs.getLikesEmail());
            case SYSTEM_MESSAGE -> Boolean.TRUE.equals(prefs.getSystemEmail());
        };
    }

    private String buildNotificationMessage(NotificationEventDTO event, User actor) {
        String actorName = actor != null ? actor.getUsername() : "Someone";
        
        return switch (event.type()) {
            case NEW_COMMENT -> actorName + " commented on your post.";
            case NEW_FOLLOWER -> actorName + " started following you.";
            case FOLLOW_REQUEST -> actorName + " sent you a follow request.";
            case FOLLOW_ACCEPT -> actorName + " accepted your follow request.";
            case MENTION_POST -> actorName + " mentioned you in a post.";
            case MENTION_COMMENT -> actorName + " mentioned you in a comment.";
            case NEW_REACTION_POST -> actorName + " reacted to your post.";
            case NEW_REACTION_COMMENT -> actorName + " reacted to your comment.";
            case SYSTEM_MESSAGE -> {
                if (event.additionalData() != null && event.additionalData().containsKey("message")) {
                    yield event.additionalData().get("message");
                }
                yield "You have a new system notification.";
            }
        };
    }

    private String buildNotificationLink(NotificationEventDTO event, String baseUrl) {
        if (event.contentType() == null || event.contentId() == null) {
            return null;
        }

        String relativeLink = switch (event.contentType()) {
            case POST -> "/posts/" + event.contentId();
            case BLOG -> "/blogs/" + event.contentId();
            case COMMENT -> {
                // For comments, we need to get the parent post/blog ID
                Comment comment = commentRepository.findById(event.contentId()).orElse(null);
                if (comment != null) {
                    yield switch (comment.getContentType()) {
                        case POST -> "/posts/" + comment.getContentId() + "#comment-" + event.contentId();
                        case BLOG -> "/blogs/" + comment.getContentId() + "#comment-" + event.contentId();
                        case STORY -> null;
                        case COMMENT -> null;
                    };
                }
                yield null;
            }
            case STORY -> null;
        };

        return relativeLink != null ? baseUrl + relativeLink : null;
    }

    private String buildEmailSubject(NotificationType type) {
        return switch (type) {
            case NEW_COMMENT -> "New Comment on Your Post";
            case NEW_FOLLOWER -> "New Follower";
            case FOLLOW_REQUEST -> "New Follow Request";
            case FOLLOW_ACCEPT -> "Follow Request Accepted";
            case MENTION_POST -> "You Were Mentioned in a Post";
            case MENTION_COMMENT -> "You Were Mentioned in a Comment";
            case NEW_REACTION_POST -> "New Reaction on Your Post";
            case NEW_REACTION_COMMENT -> "New Reaction on Your Comment";
            case SYSTEM_MESSAGE -> "System Notification";
        };
    }

    private String getEmailTemplateName(NotificationType type) {
        return switch (type) {
            case NEW_COMMENT -> "newCommentNotification";
            case NEW_FOLLOWER -> "newFollowerNotification";
            case FOLLOW_REQUEST -> "followRequestNotification";
            case FOLLOW_ACCEPT -> "followAcceptNotification";
            case MENTION_POST -> "mentionPostNotification";
            case MENTION_COMMENT -> "mentionCommentNotification";
            case NEW_REACTION_POST -> "newReactionPostNotification";
            case NEW_REACTION_COMMENT -> "newReactionCommentNotification";
            case SYSTEM_MESSAGE -> "systemMessageNotification";
        };
    }

    private Map<String, Object> buildEmailVariables(NotificationEventDTO event, User actor, String message, String link) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("message", message);
        variables.put("link", link);
        variables.put("baseUrl", applicationProperties.baseUrl());
        
        if (actor != null) {
            variables.put("actorUsername", actor.getUsername());
        }
        
        if (event.additionalData() != null) {
            variables.putAll(event.additionalData());
        }
        
        return variables;
    }
}
