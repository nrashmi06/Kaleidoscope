package com.kaleidoscope.backend.shared.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kaleidoscope.backend.shared.exception.Image.ImageStorageException;
import com.kaleidoscope.backend.shared.service.ImageStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class ImageStorageServiceImpl implements ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageStorageServiceImpl.class);
    private final Cloudinary cloudinary;

    @Autowired
    public ImageStorageServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Async
    @Override
    public CompletableFuture<String> uploadImage(MultipartFile image, String folderPath) {
        logger.info("Starting image upload to folder: {}", folderPath);
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
            logger.info("Image upload completed: {}", imageUrl);
            return CompletableFuture.completedFuture(imageUrl);
        } catch (IOException e) {
            logger.error("Failed to upload image to Cloudinary", e);
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
        logger.info("Starting image deletion for URL: {}", imageUrl);
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new ImageStorageException("Image URL must not be null or empty");
        }

        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            logger.info("Image deletion completed for URL: {}", imageUrl);
            return CompletableFuture.completedFuture(null);
        } catch (IOException e) {
            logger.error("Failed to delete image from Cloudinary", e);
            throw new ImageStorageException("Failed to delete image from Cloudinary", e);
        }
    }

    private String extractPublicIdFromUrl(String imageUrl) {
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
}