package com.kaleidoscope.backend.shared.read_store_backup.repository;

import com.kaleidoscope.backend.shared.read_store_backup.model.ReadModelUserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReadModelUserProfileRepository extends JpaRepository<ReadModelUserProfile, Long> {
    
    @Query("SELECT u FROM ReadModelUserProfile u ORDER BY u.followerCount DESC")
    List<ReadModelUserProfile> findMostFollowedUsers();
    
    @Query("SELECT u FROM ReadModelUserProfile u WHERE u.followerCount >= :minFollowers ORDER BY u.followerCount DESC")
    List<ReadModelUserProfile> findInfluentialUsers(@Param("minFollowers") Integer minFollowers);
    
    @Query("SELECT u FROM ReadModelUserProfile u WHERE ARRAY_TO_STRING(u.interests, ',') LIKE %:interest%")
    List<ReadModelUserProfile> findByInterest(@Param("interest") String interest);
}
