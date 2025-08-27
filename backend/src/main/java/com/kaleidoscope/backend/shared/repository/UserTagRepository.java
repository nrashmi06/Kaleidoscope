package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.UserTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserTagRepository extends JpaRepository<UserTag, Long> {
}
