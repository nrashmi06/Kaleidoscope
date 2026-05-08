package com.kaleidoscope.backend.posts.service;

import java.util.Set;

public interface PersonInPostSearchService {
    Set<Long> findPostIdsForUsername(String username);
}
