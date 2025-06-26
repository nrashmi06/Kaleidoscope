package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateLanguageRequestDTO {

    @NotBlank(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}-[A-Z]{2}$", message = "Language must be in format: en-US")
    private String language;
}
