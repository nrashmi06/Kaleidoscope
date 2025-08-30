package com.kaleidoscope.backend.shared.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kaleidoscope.backend.auth.security.jwt.JwtUtils;
import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.SignatureDataDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.enums.ContentType;
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
    public UploadSignatureResponseDTO generateUploadSignatures(GenerateUploadSignatureRequestDTO request) {
        try {
            Long userId = jwtUtils.getUserIdFromContext();
            User currentUser = userRepository.findByUserId(userId);
            if(currentUser == null) {
                throw new IllegalStateException("Authenticated user not found for ID: " + userId);
            }

            String folder;
            String publicIdPrefix;
            if (ContentType.BLOG.name().equalsIgnoreCase(request.getContentType())) {
                folder = "kaleidoscope/blogs";
                publicIdPrefix = "blogs/";
            } else if (ContentType.POST.name().equalsIgnoreCase(request.getContentType())) {
                folder = "kaleidoscope/posts";
                publicIdPrefix = "posts/";
            } else {
                throw new SignatureGenerationException("Invalid contentType: " + request.getContentType());
            }

            List<SignatureDataDTO> signatures = new ArrayList<>();
            for (String fileName : request.getFileNames()) {
                String uniqueId = UUID.randomUUID().toString().substring(0, 8);
                String publicId = publicIdPrefix + System.currentTimeMillis() + "_" + uniqueId;
                long timestamp = System.currentTimeMillis() / 1000;

                Map<String, Object> params = new TreeMap<>();
                params.put("public_id", publicId);
                params.put("folder", folder);
                params.put("timestamp", timestamp);

                String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

                MediaAssetTracker tracker = MediaAssetTracker.builder()
                        .publicId(publicId)
                        .user(currentUser)
                        .contentType(request.getContentType())
                        .contentId(null)
                        .status(MediaAssetStatus.PENDING)
                        .build();
                mediaAssetTrackerRepository.save(tracker);

                SignatureDataDTO signatureData = new SignatureDataDTO(
                        signature,
                        timestamp,
                        publicId,
                        folder,
                        cloudinary.config.apiKey,
                        cloudinary.config.cloudName
                );
                signatures.add(signatureData);
            }
            return new UploadSignatureResponseDTO(signatures);
        } catch (Exception e) {
            log.error("Unexpected error generating upload signatures for files: {}", request.getFileNames(), e);
            throw new SignatureGenerationException("Failed to generate upload signatures", e);
        }
    }


    @Async
    @Override
    public CompletableFuture<Void> deleteImageByPublicId(String publicId) {
        log.info("Starting image deletion for public_id: {}", publicId);
        if (publicId == null || publicId.isEmpty()) {
            throw new ImageStorageException("Public ID must not be null or empty");
        }
        try {
            // The 'destroy' method uses the public_id, so this is very direct.
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Image deletion completed for public_id: {}", publicId);
            return CompletableFuture.completedFuture(null);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary for public_id {}: {}", publicId, e.getMessage());
            throw new ImageStorageException("Failed to delete image from Cloudinary", e);
        }
    }

    @Override
    public boolean validatePostImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return false;
        }
        return imageUrl.contains("kaleidoscope/posts");
    }

    @Override
    public boolean validateBlogImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return false;
        }
        return imageUrl.contains("kaleidoscope/blogs");
    }
}