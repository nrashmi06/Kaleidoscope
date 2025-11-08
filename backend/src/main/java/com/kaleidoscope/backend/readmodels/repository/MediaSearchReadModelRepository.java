package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.MediaSearchReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MediaSearchReadModelRepository extends JpaRepository<MediaSearchReadModel, Long> {
    
    // --- ADD THIS METHOD (Task 5.2) ---
    List<MediaSearchReadModel> findByPostId(Long postId);
}
