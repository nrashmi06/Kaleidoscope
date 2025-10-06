package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.users.controller.api.UserBlockApi;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.mapper.UserBlockMapper;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.routes.UserBlockRoutes;
import com.kaleidoscope.backend.users.service.UserBlockService;
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
public class UserBlockController implements UserBlockApi {

    private final UserBlockService userBlockService;
    private final UserBlockMapper userBlockMapper;

    @Override
    @PostMapping(UserBlockRoutes.BLOCK_USER)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<UserBlockResponseDTO>> blockUser(
            @Valid @RequestBody BlockUserRequestDTO blockUserRequestDTO) {

        log.info("Blocking user request received");
        UserBlockResponseDTO response = userBlockService.blockUser(blockUserRequestDTO);

        AppResponse<UserBlockResponseDTO> appResponse = AppResponse.success(
                response,
                "User blocked successfully",
                UserBlockRoutes.BLOCK_USER
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @DeleteMapping(UserBlockRoutes.UNBLOCK_USER)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<String>> unblockUser(
            @Valid @RequestBody UnblockUserRequestDTO unblockUserRequestDTO) {

        log.info("Unblocking user request received");
        String response = userBlockService.unblockUser(unblockUserRequestDTO);

        AppResponse<String> appResponse = AppResponse.success(
                response,
                "User unblocked successfully",
                UserBlockRoutes.UNBLOCK_USER
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @GetMapping(UserBlockRoutes.GET_BLOCKED_USERS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlockedUsersListResponseDTO>> getBlockedUsers(
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Getting blocked users list");
        BlockedUsersListResponseDTO response = userBlockService.getBlockedUsers(pageable);

        AppResponse<BlockedUsersListResponseDTO> appResponse = AppResponse.success(
                response,
                "Blocked users retrieved successfully",
                UserBlockRoutes.GET_BLOCKED_USERS
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @GetMapping(UserBlockRoutes.GET_USERS_WHO_BLOCKED_ME)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlockedUsersListResponseDTO>> getUsersWhoBlockedMe(
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Getting users who blocked me list");
        BlockedUsersListResponseDTO response = userBlockService.getUsersWhoBlockedMe(pageable);

        AppResponse<BlockedUsersListResponseDTO> appResponse = AppResponse.success(
                response,
                "Users who blocked you retrieved successfully",
                UserBlockRoutes.GET_USERS_WHO_BLOCKED_ME
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @GetMapping(UserBlockRoutes.CHECK_BLOCK_STATUS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppResponse<BlockStatusResponseDTO>> checkBlockStatus(@RequestParam Long targetUserId) {

        log.info("Checking block status with user {}", targetUserId);
        BlockStatusResponseDTO response = userBlockService.checkBlockStatus(targetUserId);

        AppResponse<BlockStatusResponseDTO> appResponse = AppResponse.success(
                response,
                "Block status retrieved successfully",
                UserBlockRoutes.CHECK_BLOCK_STATUS
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @GetMapping(UserBlockRoutes.GET_ALL_BLOCKS_ADMIN)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AppResponse<Page<UserBlockResponseDTO>>> getAllBlocks(
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Admin getting all blocks");
        Page<UserBlock> blocksPage = userBlockService.getAllBlocks(pageable);
        Page<UserBlockResponseDTO> response = blocksPage.map(userBlockMapper::toUserBlockResponseDTO);

        AppResponse<Page<UserBlockResponseDTO>> appResponse = AppResponse.success(
                response,
                "All blocks retrieved successfully",
                UserBlockRoutes.GET_ALL_BLOCKS_ADMIN
        );

        return ResponseEntity.ok(appResponse);
    }

    @Override
    @DeleteMapping(UserBlockRoutes.REMOVE_BLOCK_ADMIN)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AppResponse<String>> removeBlock(@RequestParam Long blockId) {

        log.info("Admin removing block with ID {}", blockId);
        String response = userBlockService.removeBlock(blockId);

        AppResponse<String> appResponse = AppResponse.success(
                response,
                "Block removed successfully",
                UserBlockRoutes.REMOVE_BLOCK_ADMIN
        );

        return ResponseEntity.ok(appResponse);
    }
}
