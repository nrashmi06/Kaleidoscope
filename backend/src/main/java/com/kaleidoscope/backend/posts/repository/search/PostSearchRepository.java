package com.kaleidoscope.backend.posts.repository.search;

import com.kaleidoscope.backend.posts.document.PostDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, String> {
}