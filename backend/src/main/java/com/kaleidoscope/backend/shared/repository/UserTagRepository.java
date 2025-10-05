package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UserTagRepository extends JpaRepository<UserTag, Long>, JpaSpecificationExecutor<UserTag> {

    /**
     * Check if a user is already tagged in specific content
     */
    boolean existsByTaggedUserAndContentTypeAndContentId(User taggedUser, ContentType contentType, Long contentId);

    /**
     * Find all tags for specific content
     */
    Page<UserTag> findByContentTypeAndContentId(ContentType contentType, Long contentId, Pageable pageable);

    /**
     * Find all tags where a specific user is tagged
     */
    Page<UserTag> findByTaggedUserUserId(Long userId, Pageable pageable);
}