package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.UserDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, String> {
    // Custom search methods can be added here if needed
}

