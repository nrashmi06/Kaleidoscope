package com.kaleidoscope.backend.users.controller;

import com.kaleidoscope.backend.auth.security.jwt.JwtUtils; // Corrected import path
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@Slf4j
@RequestMapping
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtils jwtUtils;

    @PutMapping(value = UserRoutes.UPDATE_USER_PROFILE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<?> updateUserProfile(
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart(value = "coverPhoto", required = false) MultipartFile coverPhoto,
            @RequestPart("userData") UpdateUserProfileRequestDTO userProfileData) {

        try {
            Long userId = jwtUtils.getUserIdFromContext();
            log.info("Updating profile for user ID: {}", userId);

            // Set the files in the DTO
            userProfileData.setProfilePicture(profilePicture);
            userProfileData.setCoverPhoto(coverPhoto);

            UpdateUserProfileResponseDTO updatedUser = userService.updateUserProfile(userId, userProfileData);
            return ResponseEntity.ok(updatedUser);
        } catch (UserNotFoundException e) {
            log.error("User not found during profile update", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating user profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }


    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping(UserRoutes.GET_ALL_USERS_BY_PROFILE_STATUS)
    public ResponseEntity<Page<UserDetailsSummaryResponseDTO>> getAllUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {

        try {
            Page<User> users = userService.getUsersByFilters(status, search, pageable);
            Page<UserDetailsSummaryResponseDTO> response = users.map(UserMapper::toUserDetailsSummaryResponseDTO);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving users", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping(UserRoutes.UPDATE_USER_PROFILE_STATUS)
    public ResponseEntity<String> updateUserProfileStatus(@RequestBody UpdateUserProfileStatusRequestDTO updateUserProfileStatusRequestDTO) {
        try {
            userService.updateUserProfileStatus(updateUserProfileStatusRequestDTO.getUserId(), updateUserProfileStatusRequestDTO.getProfileStatus());
            return ResponseEntity.ok("User profile status updated successfully.");
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with ID: " + updateUserProfileStatusRequestDTO.getUserId());
        }
    }
}