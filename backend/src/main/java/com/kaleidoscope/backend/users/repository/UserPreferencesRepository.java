package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferences, Long> {

    Optional<UserPreferences> findByUser_UserId(Long userId);

    boolean existsByUser_UserId(Long userId);
}
