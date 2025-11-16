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
                                                          Pageable pageable) {
        log.info("Elasticsearch blog query: authorUserId={}, categoryId={}, status={}, query={}, locationId={}, isAdmin={}",
                authorUserId, categoryId, status, query, locationId, isAdmin);

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
        if (locationId != null) {
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
}

