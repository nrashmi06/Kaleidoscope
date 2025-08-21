package com.kaleidoscope.backend.shared.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateUploadSignatureRequest {
    private String fileName;
}