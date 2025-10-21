package com.kaleidoscope.backend.shared.mapper;

import com.kaleidoscope.backend.shared.dto.response.SignatureDataDTO;
import com.kaleidoscope.backend.shared.dto.response.UploadSignatureResponseDTO;
import com.kaleidoscope.backend.shared.enums.MediaAssetStatus;
import com.kaleidoscope.backend.shared.model.MediaAssetTracker;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper for signature-related DTOs
 * Migrated from ImageStorageServiceImpl.generateUploadSignatures
 */
@Component
public class SignatureMapper {

    /**
     * Create SignatureDataDTO for Cloudinary upload
     * Migrated from ImageStorageServiceImpl.generateUploadSignatures
     */
    public static SignatureDataDTO toSignatureDataDTO(
            String signature, 
            long timestamp, 
            String publicId, 
            String folder,
            String apiKey, 
            String cloudName) {
        return new SignatureDataDTO(
                signature,
                timestamp,
                publicId,
                folder,
                apiKey,
                cloudName
        );
    }

    /**
     * Create UploadSignatureResponseDTO containing multiple signatures
     * Migrated from ImageStorageServiceImpl.generateUploadSignatures
     */
    public static UploadSignatureResponseDTO toUploadSignatureResponseDTO(List<SignatureDataDTO> signatures) {
        return new UploadSignatureResponseDTO(signatures);
    }
}
