package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserNotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationPreferencesRepository extends JpaRepository<UserNotificationPreferences, Long> {

    Optional<UserNotificationPreferences> findByUserUserId(Long userId);

    @Query("SELECT np FROM UserNotificationPreferences np WHERE np.user.userId = :userId")
    Optional<UserNotificationPreferences> findByUserId(@Param("userId") Long userId);

    boolean existsByUserUserId(Long userId);

    void deleteByUserUserId(Long userId);
}
