package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.shared.model.UserTag;
import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserTagRepository extends JpaRepository<UserTag, Long> {
    Optional<UserTag> findByTaggedUserAndContentTypeAndContentId(User taggedUser, ContentType contentType, Long contentId);
    List<UserTag> findByContentTypeAndContentId(ContentType contentType, Long contentId);
    List<UserTag> findByTaggedUser(User taggedUser);
}

