package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.repository.PostRepository;
import com.kaleidoscope.backend.posts.repository.search.PostSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PostSearchVisibilityBackfillJob implements CommandLineRunner {

    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository;

    @Value("${async.stream.post-search-visibility-backfill-enabled:false}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) return;

        log.info("Starting post_search visibility backfill...");
        List<Post> posts = postRepository.findAll();
        int success = 0;

        for (Post post : posts) {
            try {
                PostDocument doc = postSearchRepository.findById(String.valueOf(post.getPostId())).orElse(null);
                if (doc == null) continue;
                doc.setVisibility(post.getVisibility());
                postSearchRepository.save(doc);
                success++;
            } catch (Exception ex) {
                log.warn("Visibility backfill failed for postId={} reason={}", post.getPostId(), ex.getMessage());
            }
        }

        log.info("post_search visibility backfill completed: {}/{}", success, posts.size());
    }
}

