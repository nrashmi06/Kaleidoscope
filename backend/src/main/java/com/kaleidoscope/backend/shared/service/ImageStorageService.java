package com.kaleidoscope.backend.shared.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.concurrent.CompletableFuture;

public interface ImageStorageService {
    CompletableFuture<String> uploadImage(MultipartFile image, String folderPath);
    CompletableFuture<String> uploadUserProfileImage(MultipartFile image, String userId);
    CompletableFuture<String> uploadUserCoverPhoto(MultipartFile image, String userId);
    CompletableFuture<String> uploadCategoryImage(MultipartFile image, String categoryId);
    CompletableFuture<Void> deleteImage(String imageUrl);
}