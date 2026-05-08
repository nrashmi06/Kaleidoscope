package com.kaleidoscope.backend.async.config;

import com.kaleidoscope.backend.posts.document.PostDocument;
import com.kaleidoscope.backend.posts.mapper.PostMapper;
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
public class PostSearchFullReindexJob implements CommandLineRunner {

    private final PostRepository postRepository;
    private final PostSearchRepository postSearchRepository;
    private final PostMapper postMapper;

    @Value("${async.stream.post-search-reindex-enabled:false}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }

        log.info("Starting posts index full re-index from database...");
        List<Post> posts = postRepository.findAll();
        int success = 0;
        int skipped = 0;

        for (Post post : posts) {
            try {
                PostDocument doc = postMapper.toPostDocument(post);
                postSearchRepository.save(doc);
                success++;
                log.debug("Re-indexed postId={} to posts index", post.getPostId());
            } catch (Exception ex) {
                skipped++;
                log.warn("Re-index failed for postId={}: {}", post.getPostId(), ex.getMessage());
            }
        }

        log.info("Posts index full re-index completed: {}/{} succeeded, {} failed",
                success, posts.size(), skipped);
    }
}
