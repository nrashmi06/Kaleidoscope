package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.users.dto.request.BlockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UnblockUserRequestDTO;
import com.kaleidoscope.backend.users.dto.response.BlockStatusResponseDTO;
import com.kaleidoscope.backend.users.dto.response.BlockedUsersListResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserBlockResponseDTO;
import com.kaleidoscope.backend.users.exception.userblock.SelfBlockNotAllowedException;
import com.kaleidoscope.backend.users.exception.userblock.UserAlreadyBlockedException;
import com.kaleidoscope.backend.users.exception.userblock.UserBlockNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserBlockMapper;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.repository.UserBlockRepository;
import com.kaleidoscope.backend.users.service.UserBlockService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserBlockServiceImpl implements UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @Override
    public UserBlockResponseDTO blockUser(BlockUserRequestDTO blockUserRequestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long userIdToBlock = blockUserRequestDTO.getUserIdToBlock();

        log.info("User {} attempting to block user {}", currentUserId, userIdToBlock);

        // Validate self-block
        if (currentUserId.equals(userIdToBlock)) {
            throw new SelfBlockNotAllowedException();
        }

        // Get users
        User blocker = userService.getUserById(currentUserId);
        User userToBlock = userService.getUserById(userIdToBlock);

        // Check if already blocked
        Optional<UserBlock> existingBlock = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, userIdToBlock);
        if (existingBlock.isPresent()) {
            throw new UserAlreadyBlockedException(currentUserId, userIdToBlock);
        }

        // Create block
        UserBlock userBlock = UserBlock.builder()
                .blocker(blocker)
                .blocked(userToBlock)
                .build();

        UserBlock savedBlock = userBlockRepository.save(userBlock);
        log.info("User {} successfully blocked user {}", currentUserId, userIdToBlock);

        return UserBlockMapper.toUserBlockResponseDTO(savedBlock);
    }

    @Override
    public String unblockUser(UnblockUserRequestDTO unblockUserRequestDTO) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        Long userIdToUnblock = unblockUserRequestDTO.getUserIdToUnblock();

        log.info("User {} attempting to unblock user {}", currentUserId, userIdToUnblock);

        // Find existing block
        UserBlock userBlock = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, userIdToUnblock)
                .orElseThrow(() -> new UserBlockNotFoundException(currentUserId, userIdToUnblock));

        userBlockRepository.delete(userBlock);
        log.info("User {} successfully unblocked user {}", currentUserId, userIdToUnblock);

        return "User successfully unblocked";
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getBlockedUsers(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting blocked users for user {}", currentUserId);

        Page<UserBlock> blockedUsersPage = userBlockRepository.findByBlocker_UserIdWithBlocked(currentUserId, pageable);

        return BlockedUsersListResponseDTO.builder()
                .blockedUsers(blockedUsersPage.getContent().stream()
                        .map(userBlock -> UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocked()))
                        .toList())
                .currentPage(blockedUsersPage.getNumber())
                .totalPages(blockedUsersPage.getTotalPages())
                .totalElements(blockedUsersPage.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedUsersListResponseDTO getUsersWhoBlockedMe(Pageable pageable) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Getting users who blocked user {}", currentUserId);

        Page<UserBlock> blockersPage = userBlockRepository.findByBlocked_UserIdWithBlocker(currentUserId, pageable);

        return BlockedUsersListResponseDTO.builder()
                .blockedUsers(blockersPage.getContent().stream()
                        .map(userBlock -> UserMapper.toUserDetailsSummaryResponseDTO(userBlock.getBlocker()))
                        .toList())
                .currentPage(blockersPage.getNumber())
                .totalPages(blockersPage.getTotalPages())
                .totalElements(blockersPage.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BlockStatusResponseDTO checkBlockStatus(Long targetUserId) {
        Long currentUserId = jwtUtils.getUserIdFromContext();
        log.info("Checking block status between user {} and user {}", currentUserId, targetUserId);

        // Check if current user blocked target user
        Optional<UserBlock> currentUserBlocksTarget = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(currentUserId, targetUserId);

        // Check if target user blocked current user
        Optional<UserBlock> targetUserBlocksCurrent = userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(targetUserId, currentUserId);

        return BlockStatusResponseDTO.builder()
                .isBlocked(currentUserBlocksTarget.isPresent())
                .isBlockedBy(targetUserBlocksCurrent.isPresent())
                .blockId(currentUserBlocksTarget.map(UserBlock::getBlockId).orElse(null))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserBlock> getAllBlocks(Pageable pageable) {
        log.info("Admin getting all blocks with pagination");
        return userBlockRepository.findAllWithBlockerAndBlocked(pageable);
    }

    @Override
    public String removeBlock(Long blockId) {
        log.info("Admin removing block with ID {}", blockId);

        UserBlock userBlock = userBlockRepository.findById(blockId)
                .orElseThrow(() -> new UserBlockNotFoundException("Block not found with ID: " + blockId));

        userBlockRepository.delete(userBlock);
        log.info("Block with ID {} successfully removed by admin", blockId);

        return "Block relationship successfully removed";
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserBlocked(Long blockerUserId, Long blockedUserId) {
        return userBlockRepository.findByBlocker_UserIdAndBlocked_UserId(blockerUserId, blockedUserId).isPresent();
    }
}
