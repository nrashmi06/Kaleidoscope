package com.kaleidoscope.backend.shared.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateUploadSignatureRequestDTO {
    @NotEmpty(message = "File names list cannot be empty.")
    @Size(max = 10, message = "You can upload a maximum of 10 files at a time.")
    private List<String> fileNames;
}