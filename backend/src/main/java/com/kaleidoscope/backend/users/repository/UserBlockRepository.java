package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
}
