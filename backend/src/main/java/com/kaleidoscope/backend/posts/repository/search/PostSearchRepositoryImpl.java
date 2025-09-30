package com.kaleidoscope.backend.posts.repository.search;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Custom implementation of PostSearchRepository for complex Elasticsearch queries
 * Replicates the exact security and filtering logic from the deprecated PostSpecification
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class PostSearchRepositoryImpl implements PostSearchRepositoryCustom {

    private final ElasticsearchTemplate elasticsearchTemplate;

    @Override
    public Page<PostDocument> findVisibleAndFilteredPosts(
            Long currentUserId,
            Set<Long> followingIds,
            Long userId,
            Long categoryId,
            PostStatus status,
            PostVisibility visibility,
            String query,
            Pageable pageable) {
        
        log.info("Executing Elasticsearch query for posts with filters: userId={}, categoryId={}, status={}, visibility={}, query={}",
                userId, categoryId, status, visibility, query);

        // Build the main query combining filters and security rules
        BoolQuery.Builder mainQueryBuilder = new BoolQuery.Builder();

        // Add filtering clauses (MUST conditions)
        addFilterClauses(mainQueryBuilder, userId, categoryId, status, visibility, query);

        // Add security clauses based on user role and visibility rules
        addSecurityClauses(mainQueryBuilder, currentUserId, followingIds);

        // Build the native query with pagination and sorting
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(mainQueryBuilder.build()._toQuery())
                .withPageable(pageable)
                .build();

        log.debug("Executing Elasticsearch query with pagination: page={}, size={}, sort={}",
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        SearchHits<PostDocument> searchHits = elasticsearchTemplate.search(nativeQuery, PostDocument.class);
        
        List<PostDocument> postDocuments = searchHits.getSearchHits()
                .stream()
                .map(SearchHit::getContent)
                .toList();

        log.info("Elasticsearch query returned {} results out of {} total hits", 
                postDocuments.size(), searchHits.getTotalHits());

        return new PageImpl<>(postDocuments, pageable, searchHits.getTotalHits());
    }

    /**
     * Add filtering clauses to the main query (MUST conditions)
     */
    private void addFilterClauses(BoolQuery.Builder queryBuilder, Long userId, Long categoryId, 
                                  PostStatus status, PostVisibility visibility, String searchQuery) {
        
        // Filter by author ID
        if (userId != null) {
            log.debug("Adding author filter: userId={}", userId);
            queryBuilder.must(TermQuery.of(t -> t
                    .field("author.userId")
                    .value(userId))._toQuery());
        }

        // Filter by category ID (nested query)
        if (categoryId != null) {
            log.debug("Adding category filter: categoryId={}", categoryId);
            queryBuilder.must(NestedQuery.of(n -> n
                    .path("categories")
                    .query(TermQuery.of(t -> t
                            .field("categories.categoryId")
                            .value(categoryId))._toQuery()))._toQuery());
        }

        // Filter by post status
        if (status != null) {
            log.debug("Adding status filter: status={}", status);
            queryBuilder.must(TermQuery.of(t -> t
                    .field("status")
                    .value(status.toString()))._toQuery());
        }

        // Filter by post visibility
        if (visibility != null) {
            log.debug("Adding visibility filter: visibility={}", visibility);
            queryBuilder.must(TermQuery.of(t -> t
                    .field("visibility")
                    .value(visibility.toString()))._toQuery());
        }

        // Add text search query across title, summary, and body
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            log.debug("Adding text search query: query={}", searchQuery);
            
            BoolQuery.Builder textQueryBuilder = new BoolQuery.Builder();
            String trimmedQuery = searchQuery.trim().toLowerCase();
            
            // Search in title (boosted)
            textQueryBuilder.should(MatchQuery.of(m -> m
                    .field("title")
                    .query(trimmedQuery)
                    .boost(2.0f))._toQuery());
            
            // Search in summary (boosted)
            textQueryBuilder.should(MatchQuery.of(m -> m
                    .field("summary")
                    .query(trimmedQuery)
                    .boost(1.5f))._toQuery());
            
            // Search in body
            textQueryBuilder.should(MatchQuery.of(m -> m
                    .field("body")
                    .query(trimmedQuery))._toQuery());
            
            textQueryBuilder.minimumShouldMatch("1");
            queryBuilder.must(textQueryBuilder.build()._toQuery());
        }
    }

    /**
     * Add security clauses replicating PostSpecification.isVisibleToUser logic
     * This implements the complex OR conditions for post visibility
     */
    private void addSecurityClauses(BoolQuery.Builder queryBuilder, Long currentUserId, Set<Long> followingIds) {
        
        log.debug("Adding security clauses for user: currentUserId={}, followingCount={}", 
                currentUserId, followingIds != null ? followingIds.size() : 0);

        // Build the visibility rules using a SHOULD block with minimum_should_match: 1
        BoolQuery.Builder visibilityBuilder = new BoolQuery.Builder();
        
        // Rule 1: The user is the author of the post (can see all their posts regardless of status)
        if (currentUserId != null) {
            log.debug("Adding owner visibility rule for userId: {}", currentUserId);
            visibilityBuilder.should(TermQuery.of(t -> t
                    .field("author.userId")
                    .value(currentUserId))._toQuery());
        }

        // Rule 2: Post is PUBLISHED and PUBLIC (everyone can see)
        log.debug("Adding public post visibility rule");
        BoolQuery.Builder publicPostBuilder = new BoolQuery.Builder();
        publicPostBuilder.must(TermQuery.of(t -> t
                .field("status")
                .value(PostStatus.PUBLISHED.toString()))._toQuery());
        publicPostBuilder.must(TermQuery.of(t -> t
                .field("visibility")
                .value(PostVisibility.PUBLIC.toString()))._toQuery());
        
        visibilityBuilder.should(publicPostBuilder.build()._toQuery());

        // Rule 3: Post is PUBLISHED, for FOLLOWERS, and current user follows the author
        if (followingIds != null && !followingIds.isEmpty()) {
            log.debug("Adding followers post visibility rule for {} followed users", followingIds.size());
            
            BoolQuery.Builder followersPostBuilder = new BoolQuery.Builder();
            followersPostBuilder.must(TermQuery.of(t -> t
                    .field("status")
                    .value(PostStatus.PUBLISHED.toString()))._toQuery());
            followersPostBuilder.must(TermQuery.of(t -> t
                    .field("visibility")
                    .value(PostVisibility.FOLLOWERS.toString()))._toQuery());
            
            // User follows the author
            List<Long> followingList = new ArrayList<>(followingIds);
            followersPostBuilder.must(TermsQuery.of(ts -> ts
                    .field("author.userId")
                    .terms(t -> t.value(followingList.stream()
                            .map(id -> FieldValue.of(id))
                            .toList())))._toQuery());
            
            visibilityBuilder.should(followersPostBuilder.build()._toQuery());
        }

        // Set minimum should match to 1 (at least one visibility rule must match)
        visibilityBuilder.minimumShouldMatch("1");
        
        // Add the complete visibility logic as a MUST condition
        queryBuilder.must(visibilityBuilder.build()._toQuery());
        
        log.debug("Security clauses added successfully");
    }
}
