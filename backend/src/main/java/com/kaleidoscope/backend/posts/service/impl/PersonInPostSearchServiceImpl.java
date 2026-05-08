package com.kaleidoscope.backend.posts.service.impl;

import com.kaleidoscope.backend.posts.repository.MediaDetectedFaceRepository;
import com.kaleidoscope.backend.posts.service.PersonInPostSearchService;
import com.kaleidoscope.backend.readmodels.repository.FaceSearchQueryRepository;
import com.kaleidoscope.backend.users.document.UserFaceEmbeddingDocument;
import com.kaleidoscope.backend.users.repository.search.UserFaceEmbeddingSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonInPostSearchServiceImpl implements PersonInPostSearchService {

    private final FaceSearchQueryRepository faceSearchQueryRepository;
    private final UserFaceEmbeddingSearchRepository userFaceEmbeddingSearchRepository;
    private final MediaDetectedFaceRepository mediaDetectedFaceRepository;

    @Override
    public Set<Long> findPostIdsForUsername(String username) {
        if (username == null || username.isBlank()) {
            return Set.of();
        }

        String q = username.trim();
        Set<Long> ordered = new LinkedHashSet<>();

        // Primary path: deterministic identified_username hits.
        ordered.addAll(faceSearchQueryRepository.findPostIdsByIdentifiedUsername(q));

        // Optional fallback path: embedding route only when identity hits are empty.
        if (ordered.isEmpty()) {
            List<UserFaceEmbeddingDocument> users = userFaceEmbeddingSearchRepository
                    .findByUserContext_UsernameContaining(q);
            if (!users.isEmpty() && users.get(0).getEmbedding() != null) {
                List<Long> fallback = mediaDetectedFaceRepository.findPostIdsByFaceEmbeddingNative(
                        users.get(0).getEmbedding(), 0.40, 50
                );
                ordered.addAll(new HashSet<>(fallback));
            }
        }

        log.info("Person search result size={} query='{}'", ordered.size(), q);
        return ordered;
    }
}
