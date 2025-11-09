package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.async.dto.ProfilePictureEventDTO;
import com.kaleidoscope.backend.async.mapper.AsyncMapper;
import com.kaleidoscope.backend.async.service.RedisStreamPublisher;
import com.kaleidoscope.backend.async.streaming.ProducerStreamConstants;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.posts.dto.response.PostSummaryResponseDTO;
import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.service.PostService;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.exception.other.UserNotFoundException;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.document.UserDocument;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserProfileResponseDTO;
import com.kaleidoscope.backend.users.enums.FollowStatus;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.FollowRepository;
import com.kaleidoscope.backend.users.repository.FollowRequestRepository;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.repository.search.UserSearchRepository;
import com.kaleidoscope.backend.users.service.UserDocumentSyncService;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final RedisStreamPublisher redisStreamPublisher;
    private final UserDocumentSyncService userDocumentSyncService;
    private final UserSearchRepository userSearchRepository;
    private final JwtUtils jwtUtils;
    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final PostService postService;

    public UserServiceImpl(UserRepository userRepository,
                           ImageStorageService imageStorageService,
                           RedisStreamPublisher redisStreamPublisher,
                           UserDocumentSyncService userDocumentSyncService,
                           UserSearchRepository userSearchRepository,
                           JwtUtils jwtUtils,
                           FollowRepository followRepository,
                           FollowRequestRepository followRequestRepository,
                           PostService postService) {
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
        this.redisStreamPublisher = redisStreamPublisher;
        this.userDocumentSyncService = userDocumentSyncService;
        this.userSearchRepository = userSearchRepository;
        this.jwtUtils = jwtUtils;
        this.followRepository = followRepository;
        this.followRequestRepository = followRequestRepository;
        this.postService = postService;
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + userId));
    }

    @Override
    public User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException("User not found with email: " + email);
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDetailsSummaryResponseDTO> getUsersByFilters(String status, String searchTerm, Pageable pageable) {
        try {
            log.info("Fetching users with filters - status: {}, searchTerm: {}, page: {}", status, searchTerm, pageable.getPageNumber());

            // Validate status parameter if provided
            if (status != null && !status.trim().isEmpty()) {
                try {
                    AccountStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid account status: " + status);
                }
            }

            // Use custom repository method
            Page<UserDocument> userDocumentPage = userSearchRepository.findFilteredUsers(status, searchTerm, pageable);

            // Map to DTOs
            Page<UserDetailsSummaryResponseDTO> result = userDocumentPage.map(UserMapper::toUserDetailsSummaryResponseDTO);

            log.info("Successfully fetched {} users using custom repository", result.getTotalElements());
            return result;

        } catch (IllegalArgumentException e) {
            // Re-throw validation exceptions
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch users from Elasticsearch, returning empty page", e);
            return Page.empty(pageable);
        }
    }

    @Override
    @Transactional
    public void updateUserProfileStatus(Long userId, String accountStatus) {
        User user = getUserById(userId);

        AccountStatus newAccountStatus;
        try {
            newAccountStatus = AccountStatus.valueOf(accountStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid profile status: " + accountStatus);
        }

        user.setAccountStatus(newAccountStatus);
        userRepository.save(user);

        log.info("Updated account status for user ID {} to {}", userId, newAccountStatus);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                createAuthorities(user.getRole())
        );
    }

    private static List<GrantedAuthority> createAuthorities(com.kaleidoscope.backend.shared.enums.Role role) {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    @Transactional
    public UpdateUserProfileResponseDTO updateUserProfile(Long userId, UpdateUserProfileRequestDTO updateRequest) throws Exception {
        User user = getUserById(userId);

        String oldProfilePictureUrl = user.getProfilePictureUrl();
        String oldCoverPhotoUrl = user.getCoverPhotoUrl();

        String newProfilePictureUrl = null;
        String newCoverPhotoUrl = null;

        try {
            UserMapper.updateUserFromDTO(user, updateRequest);

            // Handle profile picture update with organized folder structure
            if (updateRequest.getProfilePicture() != null && !updateRequest.getProfilePicture().isEmpty()) {
                newProfilePictureUrl = imageStorageService.uploadUserProfileImage(
                        updateRequest.getProfilePicture(), userId.toString()).join();
                user.setProfilePictureUrl(newProfilePictureUrl);
            }

            // Handle cover photo update with organized folder structure
            if (updateRequest.getCoverPhoto() != null && !updateRequest.getCoverPhoto().isEmpty()) {
                newCoverPhotoUrl = imageStorageService.uploadUserCoverPhoto(
                        updateRequest.getCoverPhoto(), userId.toString()).join();
                user.setCoverPhotoUrl(newCoverPhotoUrl);
            }

            user = userRepository.save(user);

            // Trigger Elasticsearch sync for denormalized author data in posts
            try {
                Map<String, Object> profileSyncPayload = Map.of("userId", userId);
                redisStreamPublisher.publish(ProducerStreamConstants.USER_PROFILE_POST_SYNC_STREAM, profileSyncPayload);
                log.debug("Published USER_PROFILE_POST_SYNC_STREAM event for user {}", userId);
            } catch (Exception e) {
                log.error("Failed to publish user profile sync event for user {}: {}",
                         userId, e.getMessage(), e);
                // Continue execution even if stream publishing fails
            }

            if (newProfilePictureUrl != null && !newProfilePictureUrl.trim().isEmpty()) {
                // Publish to Redis Stream for ML processing - only when image URL exists
                log.info("Publishing profile picture event for user {}: imageUrl={}", userId, newProfilePictureUrl);
                ProfilePictureEventDTO event = AsyncMapper.toProfilePictureEventDTO(userId, newProfilePictureUrl);
                redisStreamPublisher.publish(ProducerStreamConstants.PROFILE_PICTURE_PROCESSING_STREAM, event);
            } else {
                log.debug("Skipping Redis Stream publishing for user {} - no profile picture URL", userId);
            }

            // Delete old images after successful save
            if (newProfilePictureUrl != null && oldProfilePictureUrl != null && !oldProfilePictureUrl.isEmpty()) {
                imageStorageService.deleteImage(oldProfilePictureUrl).join();
            }
            if (newCoverPhotoUrl != null && oldCoverPhotoUrl != null && !oldCoverPhotoUrl.isEmpty()) {
                imageStorageService.deleteImage(oldCoverPhotoUrl).join();
            }

            // Sync user document after profile update
            userDocumentSyncService.syncOnProfileUpdate(userId);

            return UserMapper.toUpdateUserProfileResponseDTO(user);

        } catch (Exception e) {
            // Cleanup any uploaded images if user save failed
            if (newProfilePictureUrl != null) {
                imageStorageService.deleteImage(newProfilePictureUrl).join();
            }
            if (newCoverPhotoUrl != null) {
                imageStorageService.deleteImage(newCoverPhotoUrl).join();
            }
            throw e;
        }
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponseDTO getUserProfile(Long profileUserId, Pageable pageable) {
        // 1. Get the viewing user's ID
        final Long viewingUserId = jwtUtils.getUserIdFromContext();

        // 2. Get the profile user's data from ELASTICSEARCH
        UserDocument profileUserDoc = userSearchRepository.findById(profileUserId.toString())
                .orElseThrow(() -> new UserNotFoundException("User profile not found with ID: " + profileUserId));

        // 3. Get profile privacy settings DIRECTLY from the UserDocument
        // This assumes profileVisibility is correctly synced, which it is.
        Visibility profileVisibility = Visibility.PUBLIC; // Default to public
        if (profileUserDoc.getProfileVisibility() != null) {
            try {
                profileVisibility = Visibility.valueOf(profileUserDoc.getProfileVisibility());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid profileVisibility value '{}' in UserDocument for userId: {}. Defaulting to PUBLIC.",
                        profileUserDoc.getProfileVisibility(), profileUserId);
            }
        }

        boolean isPrivate = profileVisibility == Visibility.FRIENDS_ONLY;
        boolean isSelf = viewingUserId.equals(profileUserId);

        // 4. Determine the follow status (This requires SQL checks)
        FollowStatus followStatus = FollowStatus.NONE;
        if (isSelf) {
            // No follow status for your own profile
        } else if (followRepository.existsByFollower_UserIdAndFollowing_UserId(viewingUserId, profileUserId)) {
            followStatus = FollowStatus.FOLLOWING;
        } else if (followRequestRepository.existsByRequester_UserIdAndRequestee_UserId(viewingUserId, profileUserId)) {
            followStatus = FollowStatus.REQUESTED;
        }

        // 5. Determine if content is viewable
        // Content is viewable if:
        // - The profile is public
        // - OR the viewer is following the profile
        // - OR the viewer is looking at their own profile
        boolean canViewContent = !isPrivate || followStatus == FollowStatus.FOLLOWING || isSelf;

        // 6. Fetch posts ONLY if content is viewable
        PaginatedResponse<PostSummaryResponseDTO> posts = null;
        if (canViewContent) {
            // Use postService.filterPosts. It's smart and already uses Elasticsearch.
            // We only pass the profileUserId as the *author* filter.
            posts = postService.filterPosts(
                    pageable,
                    profileUserId, // Filter by the profile user's ID
                    null,          // No category filter
                    PostStatus.PUBLISHED, // Only show published posts
                    null,          // Let filterPosts handle visibility
                    null,          // No query
                    null,          // No hashtag
                    null,          // No locationId
                    null,          // No nearbyLocationId
                    null           // No radius
            );
        } else {
            // Create an empty paginated response so the JSON field isn't null
            posts = PaginatedResponse.fromPage(Page.empty(pageable));
        }

        // 7. Build and return the final DTO using data from the UserDocument
        return UserProfileResponseDTO.builder()
                .userId(profileUserDoc.getUserId())
                .username(profileUserDoc.getUsername())
                .profilePictureUrl(profileUserDoc.getProfilePictureUrl())
                .coverPhotoUrl(profileUserDoc.getCoverPhotoUrl())
                .summary(profileUserDoc.getSummary())
                .designation(profileUserDoc.getDesignation())
                .followerCount(profileUserDoc.getFollowerCount() != null ? profileUserDoc.getFollowerCount() : 0)
                .followingCount(profileUserDoc.getFollowingCount() != null ? profileUserDoc.getFollowingCount() : 0)
                .isPrivate(isPrivate && !isSelf) // Only show "private" if it's not your own profile
                .followStatus(isSelf ? null : followStatus) // No follow status for self
                .posts(posts)
                .build();
    }
}
