package com.kaleidoscope.backend.users.repository.search;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.enums.Visibility; // Added import
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
import java.util.stream.Collectors;

/**
 * Custom implementation of UserSearchRepository for complex Elasticsearch queries
 * Centralizes all user search logic for better maintainability and consistency
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class UserSearchRepositoryImpl implements UserSearchRepositoryCustom {

    private final ElasticsearchTemplate elasticsearchTemplate;

    @Override
    public Page<UserDocument> findFilteredUsers(String status, String searchTerm, Pageable pageable) {
        log.info("Executing Elasticsearch query for users with filters - status: {}, searchTerm: {}", status, searchTerm);

        // Build Elasticsearch query
        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();

        // Must match: role = USER
        boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                .field("role")
                .value(Role.USER.name())
        )));

        // Filter by status if provided
        if (status != null && !status.trim().isEmpty()) {
            boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                    .field("accountStatus")
                    .value(status.toUpperCase())
            )));
        }

        // Filter by search term if provided
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String normalizedSearch = searchTerm.trim();

            BoolQuery.Builder searchQueryBuilder = new BoolQuery.Builder();
            searchQueryBuilder.minimumShouldMatch("1");

            // Search in username field
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("username")
                    .value("*" + normalizedSearch.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));

            // Search in email field
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("email")
                    .value("*" + normalizedSearch.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));

            boolQueryBuilder.must(Query.of(q -> q.bool(searchQueryBuilder.build())));
        }

        // Build the native query with pagination
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(boolQueryBuilder.build())))
                .withPageable(pageable)
                .build();

        // Execute search
        SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

        // Convert SearchHits to Page<UserDocument>
        List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        log.info("Elasticsearch query returned {} results out of {} total hits",
                userDocuments.size(), searchHits.getTotalHits());

        return new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
    }

    @Override
    public Page<UserDocument> findTaggableUsers(Long currentUserId, List<Long> blockedUserIds, List<Long> blockedByUserIds, String query, Pageable pageable) {
        log.info("[findTaggableUsers] Starting query - currentUserId: {}, searchQuery: '{}', blockedUserIds: {}, blockedByUserIds: {}, page: {}, size: {}",
                currentUserId, query,
                blockedUserIds != null ? blockedUserIds.size() : 0,
                blockedByUserIds != null ? blockedByUserIds.size() : 0,
                pageable.getPageNumber(), pageable.getPageSize());

        // Build Elasticsearch query
        BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder();

        // Must NOT be the current user
        boolQueryBuilder.mustNot(Query.of(q -> q.term(t -> t
                .field("userId")
                .value(currentUserId)
        )));
        log.debug("[findTaggableUsers] Added mustNot filter for currentUserId: {}", currentUserId);

        // Must be ACTIVE account
        boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                .field("accountStatus")
                .value(AccountStatus.ACTIVE.name())
        )));
        log.debug("[findTaggableUsers] Added must filter for accountStatus: ACTIVE");

        // Must be USER role (not ADMIN)
        boolQueryBuilder.must(Query.of(q -> q.term(t -> t
                .field("role")
                .value(Role.USER.name())
        )));
        log.debug("[findTaggableUsers] Added must filter for role: USER");

        // Must have PUBLIC tagging preference
        // IMPORTANT: Using match query because allowTagging is a 'text' field in Elasticsearch
        // Term queries don't work properly on analyzed text fields
        boolQueryBuilder.must(Query.of(q -> q.match(m -> m
                .field("allowTagging")
                .query(Visibility.PUBLIC.name())
        )));
        log.debug("[findTaggableUsers] Added must match filter for allowTagging: PUBLIC");

        // Exclude users blocked by current user
        if (blockedUserIds != null && !blockedUserIds.isEmpty()) {
            boolQueryBuilder.mustNot(Query.of(q -> q.terms(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedUserIds.stream()
                            .map(FieldValue::of)
                            .collect(Collectors.toList())))
            )));
            log.debug("[findTaggableUsers] Added mustNot filter for {} blocked users", blockedUserIds.size());
        }

        // Exclude users who blocked current user
        if (blockedByUserIds != null && !blockedByUserIds.isEmpty()) {
            boolQueryBuilder.mustNot(Query.of(q -> q.terms(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedByUserIds.stream()
                            .map(FieldValue::of)
                            .collect(Collectors.toList())))
            )));
            log.debug("[findTaggableUsers] Added mustNot filter for {} users who blocked current user", blockedByUserIds.size());
        }

        // Filter by search query if provided
        if (query != null && !query.trim().isEmpty()) {
            String normalizedSearch = query.trim();

            BoolQuery.Builder searchQueryBuilder = new BoolQuery.Builder();
            searchQueryBuilder.minimumShouldMatch("1");

            // Search in username field
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("username")
                    .value("*" + normalizedSearch.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));

            // Search in email field
            searchQueryBuilder.should(Query.of(q -> q.wildcard(w -> w
                    .field("email")
                    .value("*" + normalizedSearch.toLowerCase() + "*")
                    .caseInsensitive(true)
            )));

            boolQueryBuilder.must(Query.of(q -> q.bool(searchQueryBuilder.build())));
            log.debug("[findTaggableUsers] Added search filter for query: '{}'", normalizedSearch);
        }

        // Build the native query with pagination
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(Query.of(q -> q.bool(boolQueryBuilder.build())))
                .withPageable(pageable)
                .build();

        log.debug("[findTaggableUsers] Executing Elasticsearch query");

        // Execute search
        SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

        // Convert SearchHits to Page<UserDocument>
        List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        log.info("[findTaggableUsers] Query completed - returned {} taggable users out of {} total hits for currentUserId: {}",
                userDocuments.size(), searchHits.getTotalHits(), currentUserId);

        if (log.isDebugEnabled() && !userDocuments.isEmpty()) {
            log.debug("[findTaggableUsers] Found users: {}",
                    userDocuments.stream()
                            .map(u -> String.format("userId=%d,username=%s", u.getUserId(), u.getUsername()))
                            .collect(Collectors.joining(", ")));
        }

        return new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
    }

    @Override
    public Page<UserDocument> findBlockedUsersByIds(List<Long> blockedUserIds, Pageable pageable) {
        log.info("Executing Elasticsearch query for blocked users - count: {}", blockedUserIds.size());

        // Build Elasticsearch query to find UserDocuments with matching userIds
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(TermsQuery.of(t -> t
                        .field("userId")
                        .terms(ts -> ts.value(blockedUserIds.stream()
                                .map(FieldValue::of)
                                .collect(Collectors.toList())))
                )._toQuery())
                .withPageable(pageable)
                .build();

        // Execute search
        SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

        // Map UserDocuments
        List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        log.info("Retrieved {} blocked users out of {} total hits",
                userDocuments.size(), searchHits.getTotalHits());

        return new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
    }

    @Override
    public Page<UserDocument> findBlockingUsersByIds(List<Long> blockedByUserIds, Pageable pageable) {
        log.info("Executing Elasticsearch query for users who blocked current user - count: {}", blockedByUserIds.size());

        // Build Elasticsearch query to find UserDocuments with matching userIds
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(TermsQuery.of(t -> t
                        .field("userId")
                        .terms(ts -> ts.value(blockedByUserIds.stream()
                                .map(FieldValue::of)
                                .collect(Collectors.toList())))
                )._toQuery())
                .withPageable(pageable)
                .build();

        // Execute search
        SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

        // Map UserDocuments
        List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        log.info("Retrieved {} users who blocked current user out of {} total hits",
                userDocuments.size(), searchHits.getTotalHits());

        return new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
    }

    @Override
    public Page<UserDocument> findFollowSuggestions(
            Long targetUserId,
            Set<Long> exclusions,
            List<Long> blockedUserIds,
            List<Long> blockedByUserIds,
            Set<Long> friendsOfFriendsIds,
            List<Long> targetUserInterests,
            String targetUserDesignation,
            Pageable pageable) {

        log.info("Executing Elasticsearch query for follow suggestions - targetUserId: {}", targetUserId);
        log.debug("Context - Exclusions: {}, Blocked: {}, BlockedBy: {}, FriendsOfFriends: {}",
                exclusions.size(), blockedUserIds.size(), blockedByUserIds.size(), friendsOfFriendsIds.size());

        // Build scoring functions
        List<FunctionScore.Builder> functions = new ArrayList<>();

        // Function 1: Followers of Followers (Weight: 10.0)
        log.debug("Adding Friends-of-Friends scoring function with {} candidates", friendsOfFriendsIds.size());
        if (friendsOfFriendsIds != null && !friendsOfFriendsIds.isEmpty()) {
            functions.add(new FunctionScore.Builder()
                    .filter(TermsQuery.of(t -> t
                            .field("userId")
                            .terms(ts -> ts.value(friendsOfFriendsIds.stream().map(FieldValue::of).collect(Collectors.toList())))
                    )._toQuery())
                    .weight(10.0)
            );
        }

        // Function 2: Shared Interests (Weight: 5.0)
        log.debug("Adding Interest-based scoring function");
        if (targetUserInterests != null && !targetUserInterests.isEmpty()) {
            functions.add(new FunctionScore.Builder()
                    .filter(TermsQuery.of(t -> t
                            .field("interests")
                            .terms(ts -> ts.value(targetUserInterests.stream().map(FieldValue::of).collect(Collectors.toList())))
                    )._toQuery())
                    .weight(5.0)
            );
        }

        // Function 3: Similar Designation (Weight: 2.0)
        log.debug("Adding Designation-based scoring function");
        if (targetUserDesignation != null && !targetUserDesignation.isBlank()) {
            functions.add(new FunctionScore.Builder()
                    .filter(MatchQuery.of(m -> m
                            .field("designation")
                            .query(targetUserDesignation)
                    )._toQuery())
                    .weight(2.0)
            );
        }

        // Function 4: Popularity Boost for Cold Start (Follower Count)
        log.debug("Adding Follower Count boost for cold start scenarios");
        functions.add(new FunctionScore.Builder()
                .filter(ExistsQuery.of(e -> e
                        .field("followerCount")
                )._toQuery())
                .weight(0.75)
        );

        // Function 5: Recently Active Users Boost (for Diversity)
        log.debug("Adding Recent Activity boost for diversity");
        functions.add(new FunctionScore.Builder()
                .filter(ExistsQuery.of(e -> e
                        .field("lastSeen")
                )._toQuery())
                .weight(1.5)
        );

        // Build main query with blocking and visibility filters
        log.debug("Building main query with blocking and visibility filters");
        BoolQuery.Builder mainQueryBuilder = new BoolQuery.Builder()
                // Filter for ACTIVE users only
                .must(TermQuery.of(t -> t
                        .field("accountStatus")
                        .value(AccountStatus.ACTIVE.name())
                )._toQuery())
                // Exclude already followed users and self
                .mustNot(TermsQuery.of(t -> t
                        .field("userId")
                        .terms(ts -> ts.value(exclusions.stream().map(FieldValue::of).collect(Collectors.toList())))
                )._toQuery())
                // ******* ADDED FILTER: Must NOT have profileVisibility = NO_ONE *******
                .mustNot(TermQuery.of(t -> t
                        .field("profileVisibility") // Assuming profileVisibility is indexed as keyword in UserDocument
                        .value(Visibility.NO_ONE.name())
                )._toQuery());


        // Exclude users blocked by target user
        if (blockedUserIds != null && !blockedUserIds.isEmpty()) {
            log.debug("Adding filter to exclude {} users blocked by target user", blockedUserIds.size());
            mainQueryBuilder.mustNot(TermsQuery.of(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedUserIds.stream().map(FieldValue::of).collect(Collectors.toList())))
            )._toQuery());
        }

        // Exclude users who have blocked the target user
        if (blockedByUserIds != null && !blockedByUserIds.isEmpty()) {
            log.debug("Adding filter to exclude {} users who blocked target user", blockedByUserIds.size());
            mainQueryBuilder.mustNot(TermsQuery.of(t -> t
                    .field("userId")
                    .terms(ts -> ts.value(blockedByUserIds.stream().map(FieldValue::of).collect(Collectors.toList())))
            )._toQuery());
        }

        Query mainQuery = mainQueryBuilder.build()._toQuery();

        FunctionScoreQuery functionScoreQuery = FunctionScoreQuery.of(fs -> fs
                .query(mainQuery)
                .functions(functions.stream().map(FunctionScore.Builder::build).collect(Collectors.toList()))
                .scoreMode(FunctionScoreMode.Sum)
        );

        // Build the native query with pagination
        log.debug("Executing Elasticsearch query for user {} with {} scoring functions", targetUserId, functions.size());
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(functionScoreQuery._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<UserDocument> searchHits = elasticsearchTemplate.search(nativeQuery, UserDocument.class);

        List<UserDocument> userDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());

        log.info("Returned {} suggestions for user {} out of {} total hits",
                userDocuments.size(), targetUserId, searchHits.getTotalHits());

        return new PageImpl<>(userDocuments, pageable, searchHits.getTotalHits());
    }
}

