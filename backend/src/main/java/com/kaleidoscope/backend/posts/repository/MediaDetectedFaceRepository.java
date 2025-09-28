package com.kaleidoscope.backend.posts.repository;

import com.kaleidoscope.backend.posts.model.MediaDetectedFace;
import com.kaleidoscope.backend.posts.enums.FaceDetectionStatus;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaDetectedFaceRepository extends JpaRepository<MediaDetectedFace, Long> {
    
    List<MediaDetectedFace> findByMediaAiInsights_MediaId(Long mediaId);

    List<MediaDetectedFace> findByIdentifiedUser(User user);

    List<MediaDetectedFace> findByIdentifiedUser_UserId(Long userId);

    List<MediaDetectedFace> findBySuggestedUser(User user);

    List<MediaDetectedFace> findBySuggestedUser_UserId(Long userId);

    List<MediaDetectedFace> findByStatus(FaceDetectionStatus status);
    
    @Query("SELECT f FROM MediaDetectedFace f WHERE f.confidenceScore >= :minConfidence AND f.status = :status")
    List<MediaDetectedFace> findByMinConfidenceAndStatus(@Param("minConfidence") Float minConfidence, 
                                                         @Param("status") FaceDetectionStatus status);
}
