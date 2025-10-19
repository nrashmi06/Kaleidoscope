package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.FollowRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FollowRequestRepository extends JpaRepository<FollowRequest, Long> {

    Optional<FollowRequest> findByRequester_UserIdAndRequestee_UserId(Long requesterId, Long requesteeId);

    Page<FollowRequest> findByRequestee_UserIdOrderByCreatedAtDesc(Long requesteeId, Pageable pageable);

    boolean existsByRequester_UserIdAndRequestee_UserId(Long requesterId, Long requesteeId);

    void deleteByRequester_UserIdAndRequestee_UserId(Long requesterId, Long requesteeId);
}

