package com.kaleidoscope.backend.blogs.repository.search;

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
}

