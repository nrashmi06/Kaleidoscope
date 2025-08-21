package com.kaleidoscope.backend.shared.service;

import com.kaleidoscope.backend.shared.dto.request.GenerateUploadSignatureRequest;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.concurrent.CompletableFuture;

public interface ImageStorageService {
    CompletableFuture<String> uploadImage(MultipartFile image, String folderPath);
    CompletableFuture<String> uploadUserProfileImage(MultipartFile image, String userId);
    CompletableFuture<String> uploadUserCoverPhoto(MultipartFile image, String userId);
    CompletableFuture<String> uploadCategoryImage(MultipartFile image, String categoryId);
    CompletableFuture<Void> deleteImage(String imageUrl);

    UploadSignatureResponse generatePostUploadSignature(GenerateUploadSignatureRequest request);
    boolean validatePostImageUrl(String imageUrl);
}