package com.kaleidoscope.backend.shared.response;

import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private List<String> errors;
    private long timestamp;
    private String path;

    public static <T> ApiResponse<T> success(T data, String message, String path) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .errors(Collections.emptyList())
                .timestamp(Instant.now().toEpochMilli())
                .path(path)
                .build();
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors, String path) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .errors(errors != null ? errors : new ArrayList<>())
                .timestamp(Instant.now().toEpochMilli())
                .path(path)
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String error, String path) {
        List<String> errors = new ArrayList<>();
        if (error != null) {
            errors.add(error);
        }
        return error(message, errors, path);
    }
}