
package com.kaleidoscope.backend.posts.dto.request;

import com.kaleidoscope.backend.posts.enums.PostVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Set;

/**
 * DTO for creating a new post.
 * It gathers all required information from the client in a single API call,
 * including content, media filenames, and IDs for related entities.
 */
@Data
public class PostCreateRequestDTO {

    // --- Core Post Content ---

    @NotBlank(message = "Title cannot be blank")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @NotNull(message = "Body content cannot be null")
    private String body;

    @Size(max = 500, message = "Summary cannot exceed 500 characters")
    private String summary;

    // --- Media Information ---

    // A list of filenames the client intends to upload. This is used to generate
    // pre-signed URLs. The list itself should not be empty, but it's okay if it's not provided.
    private List<String> mediaFilenames;

    // --- Post Metadata ---

    @NotNull(message = "Visibility must be specified (e.g., PUBLIC, PRIVATE)")
    private PostVisibility visibility;

    // --- Relationships (using IDs) ---

    /**
     * Optional: The ID of the Location to associate with this post.
     * The client should fetch available locations or create a new one via a
     * separate endpoint before creating the post. If null, the post has no location.
     */
    private Long locationId;

    /**
     * A set of IDs for the Categories to associate with this post.
     * The client should have access to a list of available category IDs.
     */
    @NotEmpty(message = "Post must be associated with at least one category")
    private Set<Long> categoryIds;
}