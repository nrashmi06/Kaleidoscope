package com.kaleidoscope.backend.users.repository;


import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    User findByUsername(String username);
    User findByUserId(Long userId);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    @Query("SELECT u FROM User u WHERE " +
            "u.role = 'USER' AND " +
            "(:status IS NULL OR u.accountStatus = :status) AND " +
            "(:search IS NULL OR " +
            "LOWER(CAST(u.username AS string)) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findUsersWithFilters(
            @Param("status") AccountStatus status,
            @Param("search") String search,
            Pageable pageable);
    @Query("SELECT u FROM User u WHERE " +
            "u.role = 'USER' AND " +
            "(:status IS NULL OR u.accountStatus = :status)")
    Page<User> findUsersWithFilters(
            @Param("status") AccountStatus status,
            Pageable pageable);
}