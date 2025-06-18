package com.kaleidoscope.backend.users.repository;

import com.kaleidoscope.backend.users.model.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

}
