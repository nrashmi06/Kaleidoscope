package com.kaleidoscope.backend.blogs.controller.api;

import com.kaleidoscope.backend.blogs.dto.request.BlogCreateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogStatusUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.request.BlogUpdateRequestDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogCreationResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogDetailResponseDTO;
import com.kaleidoscope.backend.blogs.dto.response.BlogSummaryResponseDTO;
import com.kaleidoscope.backend.blogs.routes.BlogsRoutes;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Blog", description = "APIs for managing blogs")
public interface BlogApi {

    @Operation(summary = "Generate upload signatures", description = "Generates presigned URLs for uploading blog media.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Signatures generated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping(BlogsRoutes.GENERATE_UPLOAD_SIGNATURES)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<UploadSignatureResponseDTO>> generateUploadSignatures(
            @Parameter(description = "Request body for generating upload signatures")
            @Valid @RequestBody GenerateUploadSignatureRequestDTO requestDTO);

    @Operation(summary = "Create a new blog", description = "Creates a new blog after media is uploaded.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Blog created successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Blog already exists")
    })
    @PostMapping(BlogsRoutes.CREATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<BlogCreationResponseDTO>> createBlog(
            @Parameter(description = "Blog creation request body")
            @Valid @RequestBody BlogCreateRequestDTO blogCreateRequestDTO);

    @Operation(summary = "Update an existing blog", description = "Updates an existing blog, including title, body, summary, categories, and location.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blog updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Blog not found")
    })
    @PutMapping(BlogsRoutes.UPDATE_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<BlogCreationResponseDTO>> updateBlog(
            @Parameter(description = "ID of the blog to update")
            @PathVariable Long blogId,
            @Parameter(description = "Blog update request body")
            @Valid @RequestBody BlogUpdateRequestDTO requestDTO);

    @Operation(summary = "Soft delete a blog", description = "Soft deletes a blog. Only the owner or an admin can perform this action.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blog deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Blog not found")
    })
    @DeleteMapping(BlogsRoutes.DELETE_BLOG)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<Object>> deleteBlog(@PathVariable Long blogId);

    @Operation(summary = "Hard delete a blog (admin)", description = "Permanently deletes a blog and all associated media. Admin only.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blog hard deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Blog not found")
    })
    @DeleteMapping(BlogsRoutes.HARD_DELETE_BLOG)
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<ApiResponse<Object>> hardDeleteBlog(@PathVariable Long blogId);

    @Operation(summary = "Get blog by ID", description = "Returns a blog by id respecting status and role rules.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blog retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Blog not found")
    })
    @GetMapping(BlogsRoutes.GET_BLOG_BY_ID)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<BlogDetailResponseDTO>> getBlogById(@PathVariable Long blogId);

    @Operation(summary = "Filter blogs", description = "Returns paginated, filtered list of blogs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blogs retrieved successfully",
                content = @Content(mediaType = "application/json",
                        schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(BlogsRoutes.FILTER_BLOGS)
    @PreAuthorize("isAuthenticated()")
    ResponseEntity<ApiResponse<PaginatedResponse<BlogSummaryResponseDTO>>> filterBlogs(
            Pageable pageable,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) String q
    );

    @Operation(summary = "Update blog status (Admin only)", description = "Allows admin to change the approval status of a blog.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blog status updated successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Blog not found")
    })
    @PutMapping(BlogsRoutes.UPDATE_BLOG_STATUS)
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<ApiResponse<BlogCreationResponseDTO>> updateBlogStatus(
            @Parameter(description = "Blog ID") @PathVariable Long blogId,
            @Parameter(description = "Blog status update request") @Valid @RequestBody BlogStatusUpdateRequestDTO requestDTO);
}
