package com.kaleidoscope.backend.blogs.repository.search;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.Time;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import com.kaleidoscope.backend.blogs.document.BlogDocument;
import com.kaleidoscope.backend.blogs.enums.BlogStatus;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementation of BlogSearchRepositoryCustom.
 * Security: Admins see all blogs. Non-admins see their own blogs OR blogs with status PUBLISHED.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class BlogSearchRepositoryImpl implements BlogSearchRepositoryCustom {

    private final ElasticsearchTemplate elasticsearchTemplate;

    @Override
    public Page<BlogDocument> findVisibleAndFilteredBlogs(Long currentUserId,
                                                          boolean isAdmin,
                                                          Long authorUserId,
                                                          Long categoryId,
                                                          BlogStatus status,
                                                          String query,
                                                          Long locationId,
                                                          Pageable pageable,
                                                          Double latitude,
                                                          Double longitude,
                                                          Double radiusKm,
                                                          Long minReactions,
                                                          Long minComments,
                                                          LocalDateTime startDate,
                                                          LocalDateTime endDate) {
        log.info("Elasticsearch blog query: authorUserId={}, categoryId={}, status={}, query={}, locationId={}, latitude={}, longitude={}, radiusKm={}, minReactions={}, minComments={}, startDate={}, endDate={}, isAdmin={}",
                authorUserId, categoryId, status, query, locationId, latitude, longitude, radiusKm, minReactions, minComments, startDate, endDate, isAdmin);

        BoolQuery.Builder root = new BoolQuery.Builder();

        // Mandatory filters
        if (authorUserId != null) {
            root.must(TermQuery.of(t -> t.field("author.userId").value(authorUserId))._toQuery());
        }
        if (categoryId != null) {
            root.must(NestedQuery.of(n -> n
                    .path("categories")
                    .query(TermQuery.of(t -> t.field("categories.categoryId").value(categoryId))._toQuery())
            )._toQuery());
        }
        if (status != null) {
            root.must(TermQuery.of(t -> t.field("blogStatus").value(status.toString()))._toQuery());
        }

        // Location filtering - prioritize geo-distance query over exact locationId
        if (latitude != null && longitude != null && radiusKm != null && radiusKm > 0) {
            // Use GeoDistanceQuery if nearbyLocationId was provided
            log.debug("Adding geo-distance filter: center=({}, {}), radius={}km", latitude, longitude, radiusKm);
            root.filter(GeoDistanceQuery.of(g -> g
                    .field("location.point")
                    .location(l -> l.latlon(ll -> ll.lat(latitude).lon(longitude)))
                    .distance(radiusKm + "km")
            )._toQuery());
        } else if (locationId != null) {
            // Fallback to specific locationId if no radius query
            log.debug("Adding exact location ID filter: locationId={}", locationId);
            root.must(TermQuery.of(t -> t.field("location.id").value(locationId))._toQuery());
        }

        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            BoolQuery.Builder text = new BoolQuery.Builder();
            text.should(MatchQuery.of(m -> m.field("title").query(q).boost(2.0f))._toQuery());
            text.should(MatchQuery.of(m -> m.field("summary").query(q).boost(1.5f))._toQuery());
            text.should(MatchQuery.of(m -> m.field("body").query(q))._toQuery());
            text.minimumShouldMatch("1");
            root.must(text.build()._toQuery());
        }

        // Filter by minimum reactions
        if (minReactions != null) {
            log.debug("Adding filter for minReactions: {}", minReactions);
            root.must(RangeQuery.of(r -> r
                    .number(n -> n
                            .field("reactionCount")
                            .gte(minReactions.doubleValue())
                    )
            )._toQuery());
        }

        // Filter by minimum comments
        if (minComments != null) {
            log.debug("Adding filter for minComments: {}", minComments);
            root.must(RangeQuery.of(r -> r
                    .number(n -> n
                            .field("commentCount")
                            .gte(minComments.doubleValue())
                    )
            )._toQuery());
        }

        // Filter by date range
        if (startDate != null || endDate != null) {
            log.debug("Adding date range filter: startDate={}, endDate={}", startDate, endDate);
            root.must(RangeQuery.of(r -> {
                r.date(d -> {
                    d.field("createdAt");
                    if (startDate != null) {
                        d.gte(startDate.toString());
                    }
                    if (endDate != null) {
                        d.lte(endDate.toString());
                    }
                    return d;
                });
                return r;
            })._toQuery());
        }

        // Security clause for non-admins
        if (!isAdmin) {
            BoolQuery.Builder security = new BoolQuery.Builder();
            if (currentUserId != null) {
                security.should(TermQuery.of(t -> t.field("author.userId").value(currentUserId))._toQuery());
            }
            security.should(TermQuery.of(t -> t.field("blogStatus").value(BlogStatus.PUBLISHED.toString()))._toQuery());
            security.minimumShouldMatch("1");
            root.must(security.build()._toQuery());
        }

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(root.build()._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<BlogDocument> hits = elasticsearchTemplate.search(nativeQuery, BlogDocument.class);
        var docs = hits.getSearchHits().stream().map(SearchHit::getContent).toList();
        log.info("Blog ES query returned {} / {} hits", docs.size(), hits.getTotalHits());
        return new PageImpl<>(docs, pageable, hits.getTotalHits());
    }

    @Override
    public Page<BlogDocument> findBlogsThatTag(Long taggedBlogId,
                                               Long currentUserId,
                                               boolean isAdmin,
                                               Pageable pageable) {
        log.info("Elasticsearch blog query: findBlogsThatTag={}, currentUserId={}, isAdmin={}",
                taggedBlogId, currentUserId, isAdmin);

        BoolQuery.Builder root = new BoolQuery.Builder();

        // 1. Must be a nested query on 'blogTags' path
        root.must(NestedQuery.of(n -> n
                .path("blogTags")
                .query(TermQuery.of(t -> t
                        .field("blogTags.blogId") // Search the blogId field within the nested blogTags object
                        .value(taggedBlogId)
                )._toQuery())
        )._toQuery());

        // 2. Security clause for non-admins (same as filterBlogs)
        if (!isAdmin) {
            BoolQuery.Builder security = new BoolQuery.Builder();
            if (currentUserId != null) {
                // Can see their own blogs
                security.should(TermQuery.of(t -> t.field("author.userId").value(currentUserId))._toQuery());
            }
            // Can see published blogs
            security.should(TermQuery.of(t -> t.field("blogStatus").value(BlogStatus.PUBLISHED.toString()))._toQuery());
            security.minimumShouldMatch("1");
            root.must(security.build()._toQuery());
        }

        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(root.build()._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<BlogDocument> hits = elasticsearchTemplate.search(nativeQuery, BlogDocument.class);
        var docs = hits.getSearchHits().stream().map(SearchHit::getContent).toList();
        log.info("Blog tagged-by ES query returned {} / {} hits", docs.size(), hits.getTotalHits());
        return new PageImpl<>(docs, pageable, hits.getTotalHits());
    }

    @Override
    public List<Long> findBlogsThatTagAny(Set<Long> taggedBlogIds) {
        if (taggedBlogIds == null || taggedBlogIds.isEmpty()) {
            return Collections.emptyList();
        }
        BoolQuery.Builder root = new BoolQuery.Builder();
        root.must(NestedQuery.of(n -> n
            .path("blogTags")
            .query(TermsQuery.of(t -> t
                .field("blogTags.blogId")
                .terms(ts -> ts.value(taggedBlogIds.stream().map(FieldValue::of).collect(Collectors.toList())))
            )._toQuery())
        )._toQuery());
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(root.build()._toQuery())
                .withFields("blogId")
                .withPageable(Pageable.unpaged())
                .build();
        SearchHits<BlogDocument> hits = elasticsearchTemplate.search(nativeQuery, BlogDocument.class);
        return hits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .map(BlogDocument::getBlogId)
                .collect(Collectors.toList());
    }

    @Override
    public Page<BlogDocument> findBlogSuggestions(
            Long currentUserId, Set<Long> followingIds, List<Long> interestIds,
            List<Long> blockedUserIds, List<Long> blockedByUserIds,
            Set<String> viewedBlogIds, List<Long> socialContextBlogIds, Pageable pageable) {

        log.info("Executing blog suggestions query for user: {}", currentUserId);

        // 1. Build FILTERS
        BoolQuery.Builder filterBuilder = new BoolQuery.Builder();
        filterBuilder.must(TermQuery.of(t -> t.field("blogStatus").value(BlogStatus.PUBLISHED.toString()))._toQuery());
        if (currentUserId != null) {
            filterBuilder.mustNot(TermQuery.of(t -> t.field("author.userId").value(currentUserId))._toQuery());
        }
        if (blockedUserIds != null && !blockedUserIds.isEmpty()) {
            filterBuilder.mustNot(TermsQuery.of(ts -> ts.field("author.userId").terms(t -> t.value(blockedUserIds.stream().map(FieldValue::of).toList())))._toQuery());
        }
        if (blockedByUserIds != null && !blockedByUserIds.isEmpty()) {
            filterBuilder.mustNot(TermsQuery.of(ts -> ts.field("author.userId").terms(t -> t.value(blockedByUserIds.stream().map(FieldValue::of).toList())))._toQuery());
        }
        if (viewedBlogIds != null && !viewedBlogIds.isEmpty()) {
            // Convert String IDs to Long IDs for proper comparison
            List<FieldValue> viewedIds = viewedBlogIds.stream()
                    .map(id -> {
                        try {
                            return FieldValue.of(Long.parseLong(id));
                        } catch (NumberFormatException e) {
                            log.warn("Invalid blog ID in viewed set: {}", id);
                            return null;
                        }
                    })
                    .filter(fv -> fv != null)
                    .collect(Collectors.toList());
            if (!viewedIds.isEmpty()) {
                filterBuilder.mustNot(TermsQuery.of(ts -> ts.field("blogId").terms(t -> t.value(viewedIds)))._toQuery());
            }
        }

        // 2. Build SCORING FUNCTIONS
        List<FunctionScore> scoringFunctions = new ArrayList<>();

        // Func 1: Follows (weight: 10.0)
        if (followingIds != null && !followingIds.isEmpty()) {
            scoringFunctions.add(FunctionScore.of(f -> f
                    .filter(TermsQuery.of(ts -> ts.field("author.userId").terms(t -> t.value(followingIds.stream().map(FieldValue::of).toList())))._toQuery())
                    .weight(10.0)
            ));
            log.debug("Score function 1: Following boost for {} users", followingIds.size());
        }

        // Func 2: Interests (weight: 5.0)
        if (interestIds != null && !interestIds.isEmpty()) {
            scoringFunctions.add(FunctionScore.of(f -> f
                    .filter(NestedQuery.of(n -> n
                            .path("categories")
                            .query(TermsQuery.of(ts -> ts.field("categories.categoryId").terms(t -> t.value(interestIds.stream().map(FieldValue::of).toList())))._toQuery())
                    )._toQuery())
                    .weight(5.0)
            ));
            log.debug("Score function 2: Interest boost for {} categories", interestIds.size());
        }

        // Func 3: Social Context (Tags) (weight: 8.0)
        if (socialContextBlogIds != null && !socialContextBlogIds.isEmpty()) {
            scoringFunctions.add(FunctionScore.of(f -> f
                    .filter(TermsQuery.of(ts -> ts.field("blogId").terms(t -> t.value(socialContextBlogIds.stream().map(FieldValue::of).toList())))._toQuery())
                    .weight(8.0)
            ));
            log.debug("Score function 3: Social context boost for {} blogs", socialContextBlogIds.size());
        }

        // Func 4: Recency Boost (weight: 6.0)
        // Boost based on how recent the blog is (exponential decay over 7 days)
        scoringFunctions.add(FunctionScore.of(f -> f
            .exp(e -> e
                .date(d -> d
                    .field("createdAt")
                    .placement(p -> p
                        .decay(0.5)
                        .offset(Time.of(tb -> tb.time("1d")))
                        .scale(Time.of(tb -> tb.time("7d")))
                        .origin("now")
                    )
                )
            )
            .weight(6.0)
        ));

        // Func 5: Author Popularity Boost (weight: 1.5)
        scoringFunctions.add(FunctionScore.of(f -> f
            .fieldValueFactor(fvf -> fvf
                .field("author.followerCount")
                .factor(1.1)
                .modifier(FieldValueFactorModifier.Log1p)
                .missing(0.0)
            )
            .weight(1.5)
        ));

        // Func 6: Reactions (weight: 2.0)
        scoringFunctions.add(FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf.field("reactionCount").factor(1.2).modifier(FieldValueFactorModifier.Log1p).missing(0.0))
                .weight(2.0)
        ));

        // Func 7: Comments (weight: 1.5)
        scoringFunctions.add(FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf.field("commentCount").factor(1.5).modifier(FieldValueFactorModifier.Log1p).missing(0.0))
                .weight(1.5)
        ));

        // Func 8: Views (weight: 1.0)
        scoringFunctions.add(FunctionScore.of(f -> f
                .fieldValueFactor(fvf -> fvf.field("viewCount").factor(0.1).modifier(FieldValueFactorModifier.Log1p).missing(0.0))
                .weight(1.0)
        ));

        log.info("Built {} scoring functions total", scoringFunctions.size());

        // 3. Build the final FunctionScoreQuery
        // Use match_all as base query (score=1) in the function_score, and apply filters separately
        // This ensures the function scores aren't multiplied by 0
        FunctionScoreQuery functionScoreQuery = FunctionScoreQuery.of(fs -> fs
                .query(MatchAllQuery.of(m -> m)._toQuery())  // Base query with score = 1
                .functions(scoringFunctions)
                .scoreMode(FunctionScoreMode.Sum)
                .boostMode(FunctionBoostMode.Replace)  // Replace instead of Multiply to avoid zero scores
        );

        // 4. Wrap function_score in a bool query with filters
        BoolQuery.Builder finalQueryBuilder = new BoolQuery.Builder();
        finalQueryBuilder.must(functionScoreQuery._toQuery());  // The scoring query
        finalQueryBuilder.filter(filterBuilder.build()._toQuery());  // Apply filters without affecting score

        log.debug("Executing Elasticsearch query with function_score and filters...");

        // 5. Build and execute NativeQuery
        NativeQuery nativeQuery = NativeQuery.builder()
                .withQuery(finalQueryBuilder.build()._toQuery())
                .withPageable(pageable)
                .build();

        SearchHits<BlogDocument> searchHits = elasticsearchTemplate.search(nativeQuery, BlogDocument.class);
        List<BlogDocument> blogDocuments = searchHits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .toList();

        log.info("Blog suggestions query returned {} results out of {} total hits (page={}, size={})",
                blogDocuments.size(), searchHits.getTotalHits(), pageable.getPageNumber(), pageable.getPageSize());

        if (blogDocuments.isEmpty() && searchHits.getTotalHits() == 0) {
            log.warn("No blog suggestions found! Check if: 1) Blogs exist with status PUBLISHED, 2) Elasticsearch is synced, 3) Filters are too restrictive");
        }

        return new PageImpl<>(blogDocuments, pageable, searchHits.getTotalHits());
    }
}

