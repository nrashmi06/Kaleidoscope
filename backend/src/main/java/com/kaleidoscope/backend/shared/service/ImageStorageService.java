package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequestDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;

public interface ImageStorageService {
    CompletableFuture<String> uploadImage(MultipartFile image, String folderPath);
    CompletableFuture<String> uploadUserProfileImage(MultipartFile image, String userId);
    CompletableFuture<String> uploadUserCoverPhoto(MultipartFile image, String userId);
    CompletableFuture<String> uploadCategoryImage(MultipartFile image, String categoryId);
    CompletableFuture<Void> deleteImage(String imageUrl);

    // Updated method to handle multiple signatures
    UploadSignatureResponseDTO generateUploadSignatures(GenerateUploadSignatureRequestDTO request);
    boolean validatePostImageUrl(String imageUrl);
    boolean validateBlogImageUrl(String imageUrl);
    String extractPublicIdFromUrl(String imageUrl);
    CompletableFuture<Void> deleteImageByPublicId(String publicId);
}