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
        log.info("[uploadImage] Starting image upload to folder: {}", folderPath);
        if (image == null || image.isEmpty()) {
            log.error("[uploadImage] Image file is null or empty");
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
            log.debug("[uploadImage] Cloudinary upload result: {}", uploadResult);
            String imageUrl = uploadResult.get("secure_url").toString();
            log.info("[uploadImage] Image upload completed: {}", imageUrl);
            return CompletableFuture.completedFuture(imageUrl);
        } catch (IOException e) {
            log.error("[uploadImage] Failed to upload image to Cloudinary", e);
            throw new ImageStorageException("Failed to upload image to Cloudinary", e);
        }
    }

    @Override
    public CompletableFuture<String> uploadUserProfileImage(MultipartFile image, String userId) {
        log.info("[uploadUserProfileImage] Uploading profile image for userId: {}", userId);
        return uploadImage(image, "users/profiles/" + userId);
    }

    @Override
    public CompletableFuture<String> uploadUserCoverPhoto(MultipartFile image, String userId) {
        log.info("[uploadUserCoverPhoto] Uploading cover photo for userId: {}", userId);
        return uploadImage(image, "users/covers/" + userId);
    }

    @Override
    public CompletableFuture<String> uploadCategoryImage(MultipartFile image, String categoryId) {
        log.info("[uploadCategoryImage] Uploading category image for categoryId: {}", categoryId);
        return uploadImage(image, "categories/" + categoryId);
    }

    @Async
    @Override
    public CompletableFuture<Void> deleteImage(String imageUrl) {
        log.info("[deleteImage] Starting image deletion for URL: {}", imageUrl);
        if (imageUrl == null || imageUrl.isEmpty()) {
            log.error("[deleteImage] Image URL is null or empty");
            throw new ImageStorageException("Image URL must not be null or empty");
        }
        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            log.debug("[deleteImage] Extracted publicId: {} from imageUrl: {}", publicId, imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("[deleteImage] Image deletion completed for URL: {}", imageUrl);
            return CompletableFuture.completedFuture(null);
        } catch (IOException e) {
            log.error("[deleteImage] Failed to delete image from Cloudinary", e);
            throw new ImageStorageException("Failed to delete image from Cloudinary", e);
        }
    }

    @Override
    public String extractPublicIdFromUrl(String imageUrl) {
        log.info("[extractPublicIdFromUrl] Extracting publicId from imageUrl: {}", imageUrl);
        String[] urlParts = imageUrl.split("/");
        for (int i = 0; i < urlParts.length; i++) {
            if (urlParts[i].equals("posts") || urlParts[i].equals("blogs")) {
                if (i + 1 < urlParts.length) {
                    String fileWithExt = urlParts[i + 1];
                    String fileName = fileWithExt.contains(".") ? fileWithExt.substring(0, fileWithExt.lastIndexOf('.')) : fileWithExt;
                    log.debug("[extractPublicIdFromUrl] Extracted publicId: {}", fileName);
                    return fileName;
                }
            }
        }
        log.error("[extractPublicIdFromUrl] Could not extract publicId from URL: {}", imageUrl);
        throw new IllegalArgumentException("Could not extract publicId from URL: " + imageUrl);
    }

    @Override
    @Transactional
    public UploadSignatureResponseDTO generateUploadSignatures(GenerateUploadSignatureRequestDTO request) {
        log.info("[generateUploadSignatures] Generating upload signatures for files: {}", request.getFileNames());
        try {
            Long userId = jwtUtils.getUserIdFromContext();
            log.debug("[generateUploadSignatures] Retrieved userId from context: {}", userId);
            User currentUser = userRepository.findByUserId(userId);
            if(currentUser == null) {
                log.error("[generateUploadSignatures] Authenticated user not found for ID: {}", userId);
                throw new IllegalStateException("Authenticated user not found for ID: " + userId);
            }

            String folder;
            String publicIdPrefix = "";
            if (ContentType.BLOG.name().equalsIgnoreCase(request.getContentType())) {
                folder = "kaleidoscope/blogs";
            } else if (ContentType.POST.name().equalsIgnoreCase(request.getContentType())) {
                folder = "kaleidoscope/posts";
            } else {
                log.error("[generateUploadSignatures] Invalid contentType: {}", request.getContentType());
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
                log.debug("[generateUploadSignatures] Saved MediaAssetTracker for publicId: {}", publicId);

                SignatureDataDTO signatureData = new SignatureDataDTO(
                        signature,
                        timestamp,
                        publicId,
                        folder,
                        cloudinary.config.apiKey,
                        cloudinary.config.cloudName
                );
                signatures.add(signatureData);
                log.debug("[generateUploadSignatures] Generated signature for file: {} publicId: {}", fileName, publicId);
            }
            log.info("[generateUploadSignatures] Successfully generated {} signatures", signatures.size());
            return new UploadSignatureResponseDTO(signatures);
        } catch (Exception e) {
            log.error("[generateUploadSignatures] Unexpected error generating upload signatures for files: {}", request.getFileNames(), e);
            throw new SignatureGenerationException("Failed to generate upload signatures", e);
        }
    }

    @Async
    @Override
    public CompletableFuture<Void> deleteImageByPublicId(String publicId) {
        log.info("[deleteImageByPublicId] Starting image deletion for public_id: {}", publicId);
        if (publicId == null || publicId.isEmpty()) {
            log.error("[deleteImageByPublicId] Public ID is null or empty");
            throw new ImageStorageException("Public ID must not be null or empty");
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("[deleteImageByPublicId] Image deletion completed for public_id: {}", publicId);
            return CompletableFuture.completedFuture(null);
        } catch (IOException e) {
            log.error("[deleteImageByPublicId] Failed to delete image from Cloudinary for public_id {}: {}", publicId, e.getMessage());
            throw new ImageStorageException("Failed to delete image from Cloudinary", e);
        }
    }

    @Override
    public boolean validatePostImageUrl(String imageUrl) {
        log.info("[validatePostImageUrl] Validating post image URL: {}", imageUrl);
        if (imageUrl == null || imageUrl.isEmpty()) {
            log.warn("[validatePostImageUrl] Image URL is null or empty");
            return false;
        }
        boolean valid = imageUrl.contains("kaleidoscope/posts");
        log.debug("[validatePostImageUrl] Validation result: {}", valid);
        return valid;
    }

    @Override
    public boolean validateBlogImageUrl(String imageUrl) {
        log.info("[validateBlogImageUrl] Validating blog image URL: {}", imageUrl);
        if (imageUrl == null || imageUrl.isEmpty()) {
            log.warn("[validateBlogImageUrl] Image URL is null or empty");
            return false;
        }
        boolean valid = imageUrl.contains("kaleidoscope/blogs");
        log.debug("[validateBlogImageUrl] Validation result: {}", valid);
        return valid;
    }
}