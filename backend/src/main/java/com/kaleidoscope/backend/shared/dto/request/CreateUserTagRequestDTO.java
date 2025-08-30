package com.kaleidoscope.backend.shared.dto.request;

import com.kaleidoscope.backend.shared.enums.ContentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserTagRequestDTO {
    
    @NotNull(message = "Tagged user ID is required")
    private Long taggedUserId;
    
    @NotNull(message = "Content type is required")
    private ContentType contentType;
    
    @NotNull(message = "Content ID is required")
    private Long contentId;
}
