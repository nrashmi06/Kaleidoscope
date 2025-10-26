package com.kaleidoscope.backend.users.repository.search;

import com.kaleidoscope.backend.users.document.UserDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, String>, UserSearchRepositoryCustom {
    // Existing simple derived query methods remain here if needed
}
