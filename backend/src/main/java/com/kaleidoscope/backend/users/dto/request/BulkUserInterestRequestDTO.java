package com.kaleidoscope.backend.users.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkUserInterestRequestDTO {

    @NotNull(message = "Category IDs list is required")
    @NotEmpty(message = "Category IDs list cannot be empty")
    private List<@NotNull(message = "Category ID cannot be null") @Positive(message = "Category ID must be positive") Long> categoryIds;
}
