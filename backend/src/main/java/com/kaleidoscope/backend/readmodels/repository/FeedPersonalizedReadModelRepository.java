package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.FeedPersonalizedReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedPersonalizedReadModelRepository extends JpaRepository<FeedPersonalizedReadModel, Long> {

    Optional<FeedPersonalizedReadModel> findByMediaId(Long mediaId);

    List<FeedPersonalizedReadModel> findByPostId(Long postId);
}

