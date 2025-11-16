package com.kaleidoscope.backend.blogs.repository.search;

import com.kaleidoscope.backend.blogs.document.BlogDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogSearchRepository extends ElasticsearchRepository<BlogDocument, String>, BlogSearchRepositoryCustom { }

