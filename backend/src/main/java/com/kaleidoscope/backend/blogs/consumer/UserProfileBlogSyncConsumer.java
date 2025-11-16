package com.kaleidoscope.backend.blogs.consumer;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermQuery;
import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.repository.search.BlogSearchRepository;
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
 * Redis Stream consumer for synchronizing user profile changes to BlogDocument author and reviewer fields
 * Listens to USER_PROFILE_BLOG_SYNC_STREAM and performs bulk updates of denormalized author/reviewer data
 * in all BlogDocuments where the updated user is either the author or the reviewer
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileBlogSyncConsumer implements StreamListener<String, MapRecord<String, String, String>> {

    private final BlogSearchRepository blogSearchRepository;
    private final UserRepository userRepository;
    private final ElasticsearchTemplate elasticsearchTemplate;

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        // Retrieve the message ID for logging/XACK reference
        String messageId = record.getId().getValue();
        try {
            Long userId = Long.valueOf(record.getValue().get("userId"));

            log.info("[UserProfileBlogSyncConsumer] Processing profile sync for user {}, messageId: {}", userId, messageId);

            // Fetch updated user details from database
            User updatedUser = userRepository.findByUserId(userId);
            if (updatedUser == null) {
                log.warn("[UserProfileBlogSyncConsumer] User not found for userId: {}, messageId: {}", userId, messageId);
                return;
            }

            // Build BoolQuery to find all BlogDocuments where this user is either author or reviewer
            Query authorQuery = TermQuery.of(t -> t
                    .field("author.userId")
                    .value(userId))._toQuery();
            
            Query reviewerQuery = TermQuery.of(t -> t
                    .field("reviewer.userId")
                    .value(userId))._toQuery();
            
            Query boolQuery = BoolQuery.of(b -> b
                    .should(authorQuery)
                    .should(reviewerQuery)
                    .minimumShouldMatch("1"))._toQuery();
            
            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(boolQuery)
                    .build();

            // Execute search to get all blogs where this user is author or reviewer
            SearchHits<BlogDocument> searchHits = elasticsearchTemplate.search(
                    searchQuery, BlogDocument.class, IndexCoordinates.of("blogs"));

            List<BlogDocument> blogsToUpdate = searchHits.getSearchHits()
                    .stream()
                    .map(SearchHit::getContent)
                    .toList();

            if (blogsToUpdate.isEmpty()) {
                log.info("[UserProfileBlogSyncConsumer] No blogs found for user {} - skipping sync, messageId: {}",
                        userId, messageId);
                return;
            }

            log.info("[UserProfileBlogSyncConsumer] Found {} blogs to update for user {}, messageId: {}",
                    blogsToUpdate.size(), userId, messageId);

            // Create updated author and reviewer objects
            BlogDocument.Author updatedAuthor = BlogDocument.Author.builder()
                    .userId(updatedUser.getUserId())
                    .username(updatedUser.getUsername())
                    .profilePictureUrl(updatedUser.getProfilePictureUrl())
                    .email(updatedUser.getEmail())
                    .accountStatus(updatedUser.getAccountStatus() != null ? updatedUser.getAccountStatus().name() : null)
                    .build();

            BlogDocument.Reviewer updatedReviewer = BlogDocument.Reviewer.builder()
                    .userId(updatedUser.getUserId())
                    .username(updatedUser.getUsername())
                    .profilePictureUrl(updatedUser.getProfilePictureUrl())
                    .email(updatedUser.getEmail())
                    .accountStatus(updatedUser.getAccountStatus() != null ? updatedUser.getAccountStatus().name() : null)
                    .build();

            // Perform bulk update of author and/or reviewer fields
            int updatedCount = 0;
            for (BlogDocument blog : blogsToUpdate) {
                try {
                    BlogDocument.BlogDocumentBuilder updatedBlogBuilder = blog.toBuilder();

                    // Update author if this user is the author
                    if (blog.getAuthor() != null && blog.getAuthor().getUserId().equals(userId)) {
                        updatedBlogBuilder.author(updatedAuthor);
                        log.debug("[UserProfileBlogSyncConsumer] Updating author for blog {}", blog.getBlogId());
                    }

                    // Update reviewer if this user is the reviewer
                    if (blog.getReviewer() != null && blog.getReviewer().getUserId().equals(userId)) {
                        updatedBlogBuilder.reviewer(updatedReviewer);
                        log.debug("[UserProfileBlogSyncConsumer] Updating reviewer for blog {}", blog.getBlogId());
                    }

                    BlogDocument updatedBlog = updatedBlogBuilder.build();
                    blogSearchRepository.save(updatedBlog);
                    updatedCount++;

                    log.debug("[UserProfileBlogSyncConsumer] Updated blog {} with new user data for user {}", 
                             blog.getBlogId(), userId);

                } catch (Exception e) {
                    log.error("[UserProfileBlogSyncConsumer] Failed to update blog {} for user {}, messageId={}: {}",
                             blog.getBlogId(), userId, messageId, e.getMessage(), e);
                    // Continue with other blogs instead of failing the entire batch
                }
            }

            log.info("[UserProfileBlogSyncConsumer] Successfully updated {}/{} blogs for user {}, messageId: {}",
                    updatedCount, blogsToUpdate.size(), userId, messageId);

        } catch (Exception e) {
            log.error("[UserProfileBlogSyncConsumer] Error processing profile sync event for messageId={}: {}",
                     messageId, e.getMessage(), e);
            throw e; // Re-throw to prevent XACK on failure
        }
    }
}

