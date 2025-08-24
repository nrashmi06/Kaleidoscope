package com.kaleidoscope.backend.shared.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.SignatureDataDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.exception.Image.SignatureGenerationException;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import com.kaleidoscope.backend.shared.repository.MediaAssetTrackerRepository;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class ImageStorageServiceImpl implements ImageStorageService {

    private final Cloudinary cloudinary;
    private final MediaAssetTrackerRepository mediaAssetTrackerRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Autowired
    public ImageStorageServiceImpl(
            Cloudinary cloudinary,
            MediaAssetTrackerRepository mediaAssetTrackerRepository,
            UserRepository userRepository,
            JwtUtils jwtUtils) {
        this.cloudinary = cloudinary;
        this.mediaAssetTrackerRepository = mediaAssetTrackerRepository;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    @Async
    @Override
    public CompletableFuture<String> uploadImage(MultipartFile image, String folderPath) {
        log.info("Starting image upload to folder: {}", folderPath);
        if (image == null || image.isEmpty()) {
            throw new ImageStorageException("Image file must not be null or empty");
        }
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(image.getBytes(), ObjectUtils.asMap(
                    "folder", "kaleidoscope/" + folderPath,
                    "resource_type", "image",
                    "format", "jpg",
                    "quality", "auto",
                    "fetch_format", "auto"
            ));
            String imageUrl = uploadResult.get("secure_url").toString();
            log.info("Image upload completed: {}", imageUrl);
            return CompletableFuture.completedFuture(imageUrl);
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new ImageStorageException("Failed to upload image to Cloudinary", e);
        }
    }

    @Override
    public CompletableFuture<String> uploadUserProfileImage(MultipartFile image, String userId) {
        return uploadImage(image, "users/profiles/" + userId);
    }

    @Override
    public CompletableFuture<String> uploadUserCoverPhoto(MultipartFile image, String userId) {
        return uploadImage(image, "users/covers/" + userId);
    }

    @Override
    public CompletableFuture<String> uploadCategoryImage(MultipartFile image, String categoryId) {
        return uploadImage(image, "categories/" + categoryId);
    }

    @Async
    @Override
    public CompletableFuture<Void> deleteImage(String imageUrl) {
        log.info("Starting image deletion for URL: {}", imageUrl);
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new ImageStorageException("Image URL must not be null or empty");
        }

        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deletion completed for URL: {}", imageUrl);
            return CompletableFuture.completedFuture(null);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary", e);
            throw new ImageStorageException("Failed to delete image from Cloudinary", e);
        }
    }

    @Override
    public String extractPublicIdFromUrl(String imageUrl) {
        String[] urlParts = imageUrl.split("/");
        StringBuilder publicId = new StringBuilder();
        boolean foundVersion = false;
        for (int i = 0; i < urlParts.length; i++) {
            if (urlParts[i].startsWith("v") && urlParts[i].length() > 1 && Character.isDigit(urlParts[i].charAt(1))) {
                foundVersion = true;
                continue;
            }
            if (foundVersion) {
                if (i == urlParts.length - 1) {
                    String fileWithExt = urlParts[i];
                    publicId.append(fileWithExt.substring(0, fileWithExt.lastIndexOf('.')));
                } else {
                    publicId.append(urlParts[i]).append("/");
                }
            }
        }
        return publicId.toString();
    }

    @Override
    @Transactional // Add transactional to ensure the tracker is saved reliably
    public UploadSignatureResponseDTO generatePostUploadSignatures(GenerateUploadSignatureRequestDTO request) {
        try {
            // Get the current user who is initiating the upload
            Long userId = jwtUtils.getUserIdFromContext();
            User currentUser = userRepository.findByUserId(userId);
            if(currentUser == null) {
                throw new IllegalStateException("Authenticated user not found for ID: " + userId);
            }

            List<SignatureDataDTO> signatures = new ArrayList<>();

            for (String fileName : request.getFileNames()) {
                String uniqueId = UUID.randomUUID().toString().substring(0, 8);
                String publicId = "posts/" + System.currentTimeMillis() + "_" + uniqueId;
                long timestamp = System.currentTimeMillis() / 1000;

                Map<String, Object> params = new TreeMap<>();
                params.put("public_id", publicId);
                params.put("folder", "kaleidoscope/posts");
                params.put("timestamp", timestamp);

                String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);


                MediaAssetTracker tracker = MediaAssetTracker.builder()
                        .publicId(publicId)
                        .user(currentUser)
                        .status(MediaAssetStatus.PENDING)
                        .build();
                mediaAssetTrackerRepository.save(tracker);

                SignatureDataDTO signatureData = new SignatureDataDTO(
                        signature,
                        timestamp,
                        publicId,
                        "kaleidoscope/posts",
                        cloudinary.config.apiKey,
                        cloudinary.config.cloudName
                );
                signatures.add(signatureData);
            }

            return new UploadSignatureResponseDTO(signatures);

        } catch (Exception e) {
            log.error("Unexpected error generating signatures for files: {}", request.getFileNames(), e);
            throw new SignatureGenerationException("Failed to generate upload signatures", e);
        }
    }


    @Override
    public boolean validatePostImageUrl(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                return false;
            }

            String cloudName = cloudinary.config.cloudName;
            if (!imageUrl.contains("res.cloudinary.com/" + cloudName)) {
                return false;
            }

            if (!imageUrl.contains("/kaleidoscope/posts/")) {
                return false;
            }

            return true;

        } catch (Exception e) {
            log.error("Error validating post image URL: {}", imageUrl, e);
            return false;
        }
    }
}