package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.response.ApiResponse;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileStatusRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.users.exception.user.UserNotFoundException;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.routes.UserRoutes;
import com.kaleidoscope.backend.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Slf4j
@RequestMapping
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    @PutMapping(value = UserRoutes.UPDATE_USER_PROFILE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UpdateUserProfileResponseDTO>> updateUserProfile(
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart(value = "coverPhoto", required = false) MultipartFile coverPhoto,
            @RequestPart("userData") UpdateUserProfileRequestDTO userProfileData) throws Exception{

        Long userId = jwtUtils.getUserIdFromContext();
        log.info("Updating profile for user ID: {}", userId);

        // Set the files in the DTO
        userProfileData.setProfilePicture(profilePicture);
        userProfileData.setCoverPhoto(coverPhoto);

        UpdateUserProfileResponseDTO updatedUser = userService.updateUserProfile(userId, userProfileData);

        ApiResponse<UpdateUserProfileResponseDTO> response = ApiResponse.success(
                updatedUser,
                "Profile updated successfully",
                UserRoutes.UPDATE_USER_PROFILE
        );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping(UserRoutes.GET_ALL_USERS_BY_PROFILE_STATUS)
    public ResponseEntity<ApiResponse<Page<UserDetailsSummaryResponseDTO>>> getAllUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        Page<User> users = userService.getUsersByFilters(status, search, pageable);
        Page<UserDetailsSummaryResponseDTO> usersResponse = users.map(UserMapper::toUserDetailsSummaryResponseDTO);

        ApiResponse<Page<UserDetailsSummaryResponseDTO>> response = ApiResponse.success(
                usersResponse,
                "Users retrieved successfully",
                UserRoutes.GET_ALL_USERS_BY_PROFILE_STATUS
        );

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping(UserRoutes.UPDATE_USER_PROFILE_STATUS)
    public ResponseEntity<ApiResponse<String>> updateUserProfileStatus(
            @RequestBody UpdateUserProfileStatusRequestDTO updateUserProfileStatusRequestDTO) {

        userService.updateUserProfileStatus(
                updateUserProfileStatusRequestDTO.getUserId(),
                updateUserProfileStatusRequestDTO.getProfileStatus()
        );

        ApiResponse<String> response = ApiResponse.success(
                "User status updated to " + updateUserProfileStatusRequestDTO.getProfileStatus(),
                "Profile status updated successfully",
                UserRoutes.UPDATE_USER_PROFILE_STATUS
        );

        return ResponseEntity.ok(response);
    }
}