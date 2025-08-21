package com.kaleidoscope.backend.users.controller.api;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "User Block", description = "APIs for blocking and unblocking users")
public interface UserBlockApi {

    @Operation(summary = "Block a user", description = "Allows an authenticated user to block another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User blocked successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<ApiResponse<UserBlockResponseDTO>> blockUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to block a user", required = true,
                    content = @Content(schema = @Schema(implementation = BlockUserRequestDTO.class)))
            @Valid @RequestBody BlockUserRequestDTO blockUserRequestDTO);

    @Operation(summary = "Unblock a user", description = "Allows an authenticated user to unblock another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User unblocked successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<ApiResponse<String>> unblockUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to unblock a user", required = true,
                    content = @Content(schema = @Schema(implementation = UnblockUserRequestDTO.class)))
            @Valid @RequestBody UnblockUserRequestDTO unblockUserRequestDTO);

    @Operation(summary = "Get blocked users", description = "Retrieves a paginated list of users blocked by the authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blocked users retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<BlockedUsersListResponseDTO>> getBlockedUsers(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable);

    @Operation(summary = "Get users who blocked me", description = "Retrieves a paginated list of users who have blocked the authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Users who blocked you retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    ResponseEntity<ApiResponse<BlockedUsersListResponseDTO>> getUsersWhoBlockedMe(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable);

    @Operation(summary = "Check block status", description = "Checks if the authenticated user has blocked a target user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Block status retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    ResponseEntity<ApiResponse<BlockStatusResponseDTO>> checkBlockStatus(
            @Parameter(description = "The ID of the user to check the block status with", required = true)
            @RequestParam Long targetUserId);

    @Operation(summary = "Get all blocks (Admin)", description = "Retrieves a paginated list of all user blocks. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All blocks retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    ResponseEntity<ApiResponse<Page<UserBlockResponseDTO>>> getAllBlocks(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable);

    @Operation(summary = "Remove a block (Admin)", description = "Removes a user block by its ID. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Block removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Block not found")
    })
    ResponseEntity<ApiResponse<String>> removeBlock(
            @Parameter(description = "The ID of the block to remove", required = true)
            @RequestParam Long blockId);
}
