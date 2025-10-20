package com.kaleidoscope.backend.shared.repository;

import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.shared.model.Hashtag;
import com.kaleidoscope.backend.shared.model.PostHashtag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {
    
    void deleteAllByHashtag(Hashtag hashtag);
    
    void deleteAllByPost(Post post);

    void deleteByPostAndHashtag(Post post, Hashtag hashtag);
}
