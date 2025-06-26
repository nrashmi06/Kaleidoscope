package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    List<UserBlock> findByBlocker_UserId(Long blockerId);
    List<UserBlock> findByBlocked_UserId(Long blockedId);
}
