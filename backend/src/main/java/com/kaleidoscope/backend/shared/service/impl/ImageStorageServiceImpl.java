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
    public CompletableFuture<String> uploadImage(MultipartFile image) {
        logger.info("Starting image upload...");
        if (image == null || image.isEmpty()) {
            throw new ImageStorageException("Image file must not be null or empty");
        }

        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(image.getBytes(), ObjectUtils.asMap(
                    "format", "jpg"
            ));
            String imageUrl = uploadResult.get("url").toString();
            logger.info("Image upload completed: {}", imageUrl);
            return CompletableFuture.completedFuture(imageUrl);
        } catch (IOException e) {
            logger.error("Failed to upload image to Cloudinary", e);
            throw new ImageStorageException("Failed to upload image to Cloudinary", e);
        }
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
        String[] parts = imageUrl.split("/");
        String publicIdWithExtension = parts[parts.length - 1];
        return publicIdWithExtension.split("\\.")[0];
    }
}