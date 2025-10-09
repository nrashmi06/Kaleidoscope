package com.kaleidoscope.backend.posts.consumer;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Redis Stream consumer for synchronizing user profile changes to PostDocument author fields
 * Listens to USER_PROFILE_POST_SYNC_STREAM and performs bulk updates of denormalized author data
 * in all PostDocuments authored by the updated user
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfilePostSyncConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final PostSearchRepository postSearchRepository;
    private final UserRepository userRepository;
    private final ElasticsearchTemplate elasticsearchTemplate;

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        try {
            Long userId = Long.valueOf(record.getValue().get("userId"));

            log.info("[UserProfilePostSyncConsumer] Processing profile sync for user {}", userId);

            // Fetch updated user details from database
            User updatedUser = userRepository.findByUserId(userId);
            if (updatedUser == null) {
                log.warn("[UserProfilePostSyncConsumer] User not found for userId: {}", userId);
                return;
            }

            // Build query to find all PostDocuments authored by this user
            Query authorQuery = TermQuery.of(t -> t
                    .field("author.userId")
                    .value(userId))._toQuery();
            
            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(authorQuery)
                    .build();

            // Execute search to get all posts by this user
            SearchHits<PostDocument> searchHits = elasticsearchTemplate.search(
                    searchQuery, PostDocument.class, IndexCoordinates.of("posts"));

            List<PostDocument> postsToUpdate = searchHits.getSearchHits()
                    .stream()
                    .map(SearchHit::getContent)
                    .toList();

            if (postsToUpdate.isEmpty()) {
                log.info("[UserProfilePostSyncConsumer] No posts found for user {} - skipping sync", userId);
                return;
            }

            log.info("[UserProfilePostSyncConsumer] Found {} posts to update for user {}", 
                    postsToUpdate.size(), userId);

            // Perform bulk update of author fields
            int updatedCount = 0;
            for (PostDocument post : postsToUpdate) {
                try {
                    // Update the author fields with fresh user data
                    PostDocument.Author updatedAuthor = PostDocument.Author.builder()
                            .userId(updatedUser.getUserId())
                            .username(updatedUser.getUsername())
                            .profilePictureUrl(updatedUser.getProfilePictureUrl())
                            .email(updatedUser.getEmail())
                            .accountStatus(updatedUser.getAccountStatus() != null ? updatedUser.getAccountStatus().name() : null)
                            .build();

                    PostDocument updatedPost = post.toBuilder()
                            .author(updatedAuthor)
                            .build();

                    postSearchRepository.save(updatedPost);
                    updatedCount++;

                    log.debug("[UserProfilePostSyncConsumer] Updated post {} with new author data for user {}", 
                             post.getPostId(), userId);

                } catch (Exception e) {
                    log.error("[UserProfilePostSyncConsumer] Failed to update post {} for user {}: {}", 
                             post.getPostId(), userId, e.getMessage(), e);
                    // Continue with other posts even if one fails
                }
            }

            log.info("[UserProfilePostSyncConsumer] Successfully updated {} out of {} posts for user {}", 
                    updatedCount, postsToUpdate.size(), userId);

        } catch (Exception e) {
            log.error("[UserProfilePostSyncConsumer] Error processing user profile sync event: {}", 
                     e.getMessage(), e);
            // Don't rethrow - we don't want to break the stream processing
        }
    }
}
