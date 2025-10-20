package com.kaleidoscope.backend.shared.controller.api;

import com.kaleidoscope.backend.shared.dto.response.HashtagResponseDTO;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

@Tag(name = "Hashtag", description = "APIs for hashtag discovery and management")
public interface HashtagApi {

    @Operation(
            summary = "Get trending hashtags",
            description = "Retrieves a list of hashtags ordered by usage count (most popular first). " +
                    "Supports pagination to limit the number of results returned."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Trending hashtags retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid pagination parameters")
    })
    ResponseEntity<AppResponse<PaginatedResponse<HashtagResponseDTO>>> getTrendingHashtags(
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(
            summary = "Get hashtag suggestions",
            description = "Retrieves hashtag suggestions based on a prefix. " +
                    "Results are ordered by usage count. Useful for autocomplete features."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Hashtag suggestions retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid prefix or pagination parameters")
    })
    ResponseEntity<AppResponse<PaginatedResponse<HashtagResponseDTO>>> suggestHashtags(
            @Parameter(description = "Prefix to search for (e.g., 'java', 'spr')", required = true)
            String prefix,
            @Parameter(hidden = true) Pageable pageable
    );

    @Operation(
            summary = "Delete hashtag (Admin only)",
            description = "Deletes a hashtag by ID. This operation also removes all associations " +
                    "of this hashtag with posts. Only administrators can perform this operation."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Hashtag deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - User not authenticated"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not an admin"),
            @ApiResponse(responseCode = "404", description = "Hashtag not found")
    })
    ResponseEntity<AppResponse<Void>> deleteHashtag(
            @Parameter(description = "ID of the hashtag to delete", required = true)
            Long hashtagId
    );
}
