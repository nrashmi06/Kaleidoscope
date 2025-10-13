package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.FollowDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FollowSearchRepository extends ElasticsearchRepository<FollowDocument, String> {
}