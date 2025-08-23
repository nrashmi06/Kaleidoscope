package com.kaleidoscope.backend.shared.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignatureDataDTO {
    private String signature;
    private Long timestamp;
    private String publicId;
    private String folder;
    private String apiKey;
    private String cloudName;
}