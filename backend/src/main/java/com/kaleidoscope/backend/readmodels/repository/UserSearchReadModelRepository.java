package com.kaleidoscope.backend.readmodels.repository;

import com.kaleidoscope.backend.readmodels.model.UserSearchReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSearchReadModelRepository extends JpaRepository<UserSearchReadModel, Long> {
}

