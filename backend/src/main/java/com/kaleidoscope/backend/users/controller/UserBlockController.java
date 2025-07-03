package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.mapper.UserBlockMapper;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.routes.UserBlockRoutes;
import com.kaleidoscope.backend.users.service.UserBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Block", description = "APIs for blocking and unblocking users")
public class UserBlockController {

    private final UserBlockService userBlockService;
    private final UserBlockMapper userBlockMapper;

    @Operation(summary = "Block a user", description = "Allows an authenticated user to block another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User blocked successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @PostMapping(UserBlockRoutes.BLOCK_USER)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserBlockResponseDTO>> blockUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to block a user", required = true,
                    content = @Content(schema = @Schema(implementation = BlockUserRequestDTO.class)))
            @Valid @RequestBody BlockUserRequestDTO blockUserRequestDTO) {

        log.info("Blocking user request received");
        UserBlockResponseDTO response = userBlockService.blockUser(blockUserRequestDTO);

        ApiResponse<UserBlockResponseDTO> apiResponse = ApiResponse.success(
                response,
                "User blocked successfully",
                UserBlockRoutes.BLOCK_USER
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Unblock a user", description = "Allows an authenticated user to unblock another user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User unblocked successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping(UserBlockRoutes.UNBLOCK_USER)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> unblockUser(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request body to unblock a user", required = true,
                    content = @Content(schema = @Schema(implementation = UnblockUserRequestDTO.class)))
            @Valid @RequestBody UnblockUserRequestDTO unblockUserRequestDTO) {

        log.info("Unblocking user request received");
        String response = userBlockService.unblockUser(unblockUserRequestDTO);

        ApiResponse<String> apiResponse = ApiResponse.success(
                response,
                "User unblocked successfully",
                UserBlockRoutes.UNBLOCK_USER
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Get blocked users", description = "Retrieves a paginated list of users blocked by the authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Blocked users retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(UserBlockRoutes.GET_BLOCKED_USERS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlockedUsersListResponseDTO>> getBlockedUsers(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Getting blocked users list");
        BlockedUsersListResponseDTO response = userBlockService.getBlockedUsers(pageable);

        ApiResponse<BlockedUsersListResponseDTO> apiResponse = ApiResponse.success(
                response,
                "Blocked users retrieved successfully",
                UserBlockRoutes.GET_BLOCKED_USERS
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Get users who blocked me", description = "Retrieves a paginated list of users who have blocked the authenticated user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Users who blocked you retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping(UserBlockRoutes.GET_USERS_WHO_BLOCKED_ME)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlockedUsersListResponseDTO>> getUsersWhoBlockedMe(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Getting users who blocked me list");
        BlockedUsersListResponseDTO response = userBlockService.getUsersWhoBlockedMe(pageable);

        ApiResponse<BlockedUsersListResponseDTO> apiResponse = ApiResponse.success(
                response,
                "Users who blocked you retrieved successfully",
                UserBlockRoutes.GET_USERS_WHO_BLOCKED_ME
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Check block status", description = "Checks if the authenticated user has blocked a target user.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Block status retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping(UserBlockRoutes.CHECK_BLOCK_STATUS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BlockStatusResponseDTO>> checkBlockStatus(
            @Parameter(description = "The ID of the user to check the block status with", required = true)
            @RequestParam Long targetUserId) {

        log.info("Checking block status with user {}", targetUserId);
        BlockStatusResponseDTO response = userBlockService.checkBlockStatus(targetUserId);

        ApiResponse<BlockStatusResponseDTO> apiResponse = ApiResponse.success(
                response,
                "Block status retrieved successfully",
                UserBlockRoutes.CHECK_BLOCK_STATUS
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Get all blocks (Admin)", description = "Retrieves a paginated list of all user blocks. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "All blocks retrieved successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping(UserBlockRoutes.GET_ALL_BLOCKS_ADMIN)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserBlockResponseDTO>>> getAllBlocks(
            @Parameter(description = "Pagination information")
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Admin getting all blocks");
        Page<UserBlock> blocksPage = userBlockService.getAllBlocks(pageable);
        Page<UserBlockResponseDTO> response = blocksPage.map(userBlockMapper::toUserBlockResponseDTO);

        ApiResponse<Page<UserBlockResponseDTO>> apiResponse = ApiResponse.success(
                response,
                "All blocks retrieved successfully",
                UserBlockRoutes.GET_ALL_BLOCKS_ADMIN
        );

        return ResponseEntity.ok(apiResponse);
    }

    @Operation(summary = "Remove a block (Admin)", description = "Removes a user block by its ID. Requires admin privileges.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Block removed successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Block not found")
    })
    @DeleteMapping(UserBlockRoutes.REMOVE_BLOCK_ADMIN)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> removeBlock(
            @Parameter(description = "The ID of the block to remove", required = true)
            @RequestParam Long blockId) {

        log.info("Admin removing block with ID {}", blockId);
        String response = userBlockService.removeBlock(blockId);

        ApiResponse<String> apiResponse = ApiResponse.success(
                response,
                "Block removed successfully",
                UserBlockRoutes.REMOVE_BLOCK_ADMIN
        );

        return ResponseEntity.ok(apiResponse);
    }
}
