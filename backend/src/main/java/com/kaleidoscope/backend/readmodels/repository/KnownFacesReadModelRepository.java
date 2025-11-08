package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.KnownFacesReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnownFacesReadModelRepository extends JpaRepository<KnownFacesReadModel, Long> {
    
    /**
     * Finds similar faces using vector cosine similarity (KNN search).
     * This query casts the TEXT column to 'vector' to perform the search.
     * This requires the 'vector' extension to be enabled in PostgreSQL.
     */
    @Query(value = """
        SELECT *, 1 - (face_embedding::vector <=> CAST(:embedding AS vector)) as similarity
        FROM read_model_known_faces
        WHERE is_active = true
        ORDER BY face_embedding::vector <=> CAST(:embedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<KnownFacesReadModel> findSimilarFaces(
        @Param("embedding") String embedding, // The embedding as a JSON string "[0.1, ...]"
        @Param("limit") int limit
    );
}