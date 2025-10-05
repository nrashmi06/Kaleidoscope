package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.enums.ContentType;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.dto.request.CreateUserTagRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UserTagResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import org.springframework.data.domain.Pageable;

public interface UserTagService {
    
    /**
     * Find users that can be tagged by the current user based on search query
     * @param query Search query for username/email
     * @param pageable Pagination parameters
     * @return Paginated list of taggable users
     */
    PaginatedResponse<UserDetailsSummaryResponseDTO> findTaggableUsers(String query, Pageable pageable);
    
    /**
     * Create a new user tag
     * @param requestDTO Tag creation request
     * @return Created tag response
     */
    UserTagResponseDTO createUserTag(CreateUserTagRequestDTO requestDTO);
    
    /**
     * Get all tags for specific content
     * @param contentType Type of content (POST, COMMENT, etc.)
     * @param contentId ID of the content
     * @param pageable Pagination parameters
     * @return Paginated list of tags
     */
    PaginatedResponse<UserTagResponseDTO> getTagsForContent(ContentType contentType, Long contentId, Pageable pageable);
    
    /**
     * Get all content where a user is tagged
     * @param userId ID of the tagged user
     * @param pageable Pagination parameters
     * @return Paginated list of tags where user is tagged
     */
    PaginatedResponse<UserTagResponseDTO> getContentUserIsTaggedIn(Long userId, Pageable pageable);
    
    /**
     * Delete a tag by ID
     * @param tagId ID of the tag to delete
     */
    void deleteTag(Long tagId);
}
