package com.kaleidoscope.backend.shared.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateUploadSignatureRequestDTO {
    private List<String> fileNames;
}