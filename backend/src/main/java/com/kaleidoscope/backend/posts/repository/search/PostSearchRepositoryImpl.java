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
import java.util.Objects;
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

    @Override
    public Page<PostDocument> findPostSuggestions(
            Long currentUserId,
            Set<Long> followingIds,
            List<Long> interestIds,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<String> viewedPostIds,
            Pageable pageable) {

        log.info("Executing post suggestions query for user: {}", currentUserId);
        log.debug("Context - Following: {}, Interests: {}, Blocked: {}, BlockedBy: {}, ViewedPosts: {}",
                followingIds.size(), interestIds.size(), blockedUserIds.size(), blockedByUserIds.size(),
                viewedPostIds != null ? viewedPostIds.size() : 0);

        // Build filter query (must_not and must conditions) - now includes viewed posts and followingIds for visibility
        BoolQuery filterQuery = buildSuggestionFilters(currentUserId, blockedUserIds, blockedByUserIds, viewedPostIds, followingIds);

        // Build scoring functions
        List<co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore> scoringFunctions =
                buildScoringFunctions(followingIds, interestIds);

        // Build the function_score query
        FunctionScoreQuery functionScoreQuery = FunctionScoreQuery.of(fs -> fs
                .query(filterQuery._toQuery())
                .functions(scoringFunctions)
                .scoreMode(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScoreMode.Sum)
                .boostMode(co.elastic.clients.elasticsearch._types.query_dsl.FunctionBoostMode.Multiply)
        );

        // Build native query with pagination
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(functionScoreQuery._toQuery())
                .withPageable(pageable)
                .build();

        log.debug("Executing Elasticsearch function_score query with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        SearchHits<PostDocument> searchHits = elasticsearchTemplate.search(nativeQuery, PostDocument.class);

        List<PostDocument> postDocuments = searchHits.getSearchHits()
                .stream()
                .map(SearchHit::getContent)
                .toList();

        log.info("Post suggestions query returned {} results out of {} total hits",
                postDocuments.size(), searchHits.getTotalHits());

        return new PageImpl<>(postDocuments, pageable, searchHits.getTotalHits());
    }

    /**
     * Build filter conditions for post suggestions (excluding user's own posts, blocked users, etc.)
     */
    private BoolQuery buildSuggestionFilters(Long currentUserId, List<Long> blockedUserIds, List<Long> blockedByUserIds, Set<String> viewedPostIds, Set<Long> followingIds) {
        BoolQuery.Builder filterBuilder = new BoolQuery.Builder();

        // Must NOT be the current user's own posts
        if (currentUserId != null) {
            filterBuilder.mustNot(TermQuery.of(t -> t
                    .field("author.userId")
                    .value(currentUserId))._toQuery());
        }

        // Must NOT be from blocked users
        if (blockedUserIds != null && !blockedUserIds.isEmpty()) {
            filterBuilder.mustNot(TermsQuery.of(ts -> ts
                    .field("author.userId")
                    .terms(t -> t.value(blockedUserIds.stream()
                            .map(id -> FieldValue.of(id))
                            .toList())))._toQuery());
        }

        // Must NOT be from users who blocked the current user
        if (blockedByUserIds != null && !blockedByUserIds.isEmpty()) {
            filterBuilder.mustNot(TermsQuery.of(ts -> ts
                    .field("author.userId")
                    .terms(t -> t.value(blockedByUserIds.stream()
                            .map(id -> FieldValue.of(id))
                            .toList())))._toQuery());
        }

        // Must NOT be recently viewed posts (NEW: filter out viewed posts)
        if (viewedPostIds != null && !viewedPostIds.isEmpty()) {
            log.debug("Adding filter to exclude {} recently viewed post IDs", viewedPostIds.size());
            // Convert String IDs from Redis to Long for the query
            List<FieldValue> viewedIdsAsFieldValue = viewedPostIds.stream()
                    .map(idStr -> {
                        try {
                            return FieldValue.of(Long.parseLong(idStr));
                        } catch (NumberFormatException e) {
                            log.warn("Invalid post ID in viewed set: {}", idStr);
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .toList();

            if (!viewedIdsAsFieldValue.isEmpty()) {
                filterBuilder.mustNot(TermsQuery.of(ts -> ts
                        .field("postId") // Use postId field from PostDocument
                        .terms(t -> t.value(viewedIdsAsFieldValue)))._toQuery());
                log.debug("Successfully added filter for {} valid viewed post IDs", viewedIdsAsFieldValue.size());
            }
        }

        // Must be PUBLISHED
        filterBuilder.must(TermQuery.of(t -> t
                .field("status")
                .value(PostStatus.PUBLISHED.toString()))._toQuery());

        // NEW: If user is not following anyone, only show PUBLIC posts
        if (followingIds == null || followingIds.isEmpty()) {
            log.info("User {} is not following anyone - restricting suggestions to PUBLIC visibility only", currentUserId);
            filterBuilder.must(TermQuery.of(t -> t
                    .field("visibility")
                    .value(PostVisibility.PUBLIC.toString()))._toQuery());
        }

        return filterBuilder.build();
    }

    /**
     * Build scoring functions for personalized ranking
     */
    private List<co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore> buildScoringFunctions(
            Set<Long> followingIds, List<Long> interestIds) {

        List<co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore> functions = new ArrayList<>();

        // Function 1: Boost posts from followed users (weight: 10.0)
        if (followingIds != null && !followingIds.isEmpty()) {
            List<Long> followingList = new ArrayList<>(followingIds);
            functions.add(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore.of(f -> f
                    .filter(TermsQuery.of(ts -> ts
                            .field("author.userId")
                            .terms(t -> t.value(followingList.stream()
                                    .map(FieldValue::of)
                                    .toList())))._toQuery())
                    .weight(10.0)
            ));
            log.debug("Added following boost function for {} users", followingIds.size());
        }

        // Function 2: Boost posts in user's interest categories (weight: 5.0)
        if (interestIds != null && !interestIds.isEmpty()) {
            functions.add(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore.of(f -> f
                    .filter(NestedQuery.of(n -> n
                            .path("categories")
                            .query(TermsQuery.of(ts -> ts
                                    .field("categories.categoryId")
                                    .terms(t -> t.value(interestIds.stream()
                                            .map(FieldValue::of)
                                            .toList())))._toQuery()))._toQuery())
                    .weight(5.0)
            ));
            log.debug("Added interest boost function for {} categories", interestIds.size());
        }

        // Function 3: Popularity boost based on reaction count (weight: 2.0)
        functions.add(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf
                        .field("reactionCount")
                        .factor(1.2)
                        .modifier(co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier.Log1p)
                        .missing(0.0))
                .weight(2.0)
        ));
        log.debug("Added popularity boost function based on reactions");

        // Function 4: Engagement boost based on comment count (weight: 1.5)
        functions.add(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf
                        .field("commentCount")
                        .factor(1.5)
                        .modifier(co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier.Log1p)
                        .missing(0.0))
                .weight(1.5)
        ));
        log.debug("Added engagement boost function based on comments");

        // Function 5: View count boost (weight: 1.0)
        functions.add(co.elastic.clients.elasticsearch._types.query_dsl.FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf
                        .field("viewCount")
                        .factor(0.1)
                        .modifier(co.elastic.clients.elasticsearch._types.query_dsl.FieldValueFactorModifier.Log1p)
                        .missing(0.0))
                .weight(1.0)
        ));
        log.debug("Added view count boost function");

        return functions;
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
                            .map(FieldValue::of)
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
