package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.FaceSearchReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FaceSearchQueryRepository extends JpaRepository<FaceSearchReadModel, Long> {

    @Query("""
        SELECT DISTINCT fs.postId
        FROM FaceSearchReadModel fs
        WHERE (
            lower(fs.identifiedUsername) = lower(:username)
            OR lower(fs.identifiedUsername) LIKE lower(concat(:username, '%'))
        )
          AND fs.identifiedUserId IS NOT NULL
    """)
    List<Long> findPostIdsByIdentifiedUsername(@Param("username") String username);
}
