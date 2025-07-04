package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.users.model.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    // JPA will navigate through 'follower.userId' and 'following.userId'
    Optional<Follow> findByFollower_UserIdAndFollowing_UserId(Long followerId, Long followingId);

    Page<Follow> findByFollowing_UserId(Long userId, Pageable pageable);

    Page<Follow> findByFollower_UserId(Long userId, Pageable pageable);

    Page<Follow> findByFollowing_UserIdAndFollower_AccountStatus(Long userId, AccountStatus accountStatus, Pageable pageable);

    Page<Follow> findByFollower_UserIdAndFollowing_AccountStatus(Long userId, AccountStatus accountStatus, Pageable pageable);
}
