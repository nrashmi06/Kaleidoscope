package com.kaleidoscope.backend.shared.controller;

import com.kaleidoscope.backend.shared.controller.api.HashtagApi;
import com.kaleidoscope.backend.shared.dto.response.HashtagResponseDTO;
import com.kaleidoscope.backend.shared.mapper.HashtagMapper;
import com.kaleidoscope.backend.shared.model.Hashtag;
import com.kaleidoscope.backend.shared.response.AppResponse;
import com.kaleidoscope.backend.shared.response.PaginatedResponse;
import com.kaleidoscope.backend.shared.routes.HashtagRoutes;
import com.kaleidoscope.backend.shared.service.HashtagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HashtagController implements HashtagApi {

    private final HashtagService hashtagService;
    private final HashtagMapper hashtagMapper;

    @Override
    @GetMapping(HashtagRoutes.TRENDING)
    public ResponseEntity<AppResponse<PaginatedResponse<HashtagResponseDTO>>> getTrendingHashtags(
            @PageableDefault(size = 20) Pageable pageable) {
        
        log.info("Fetching trending hashtags with pagination: {}", pageable);

        Page<Hashtag> trendingHashtagsPage = hashtagService.getTrendingHashtags(pageable);
        Page<HashtagResponseDTO> responseDTOPage = trendingHashtagsPage.map(hashtagMapper::toResponseDTO);
        PaginatedResponse<HashtagResponseDTO> paginatedResponse = PaginatedResponse.fromPage(responseDTOPage);

        log.info("Retrieved {} trending hashtags", paginatedResponse.getContent().size());

        return ResponseEntity.ok(
                AppResponse.<PaginatedResponse<HashtagResponseDTO>>builder()
                        .success(true)
                        .message("Trending hashtags retrieved successfully")
                        .data(paginatedResponse)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(HashtagRoutes.TRENDING)
                        .build()
        );
    }

    @Override
    @GetMapping(HashtagRoutes.SUGGEST)
    public ResponseEntity<AppResponse<PaginatedResponse<HashtagResponseDTO>>> suggestHashtags(
            @RequestParam String prefix,
            @PageableDefault(size = 10) Pageable pageable) {
        
        log.info("Fetching hashtag suggestions for prefix: '{}' with pagination: {}", prefix, pageable);

        Page<Hashtag> suggestionsPage = hashtagService.suggestHashtags(prefix, pageable);
        Page<HashtagResponseDTO> responseDTOPage = suggestionsPage.map(hashtagMapper::toResponseDTO);
        PaginatedResponse<HashtagResponseDTO> paginatedResponse = PaginatedResponse.fromPage(responseDTOPage);

        log.info("Retrieved {} hashtag suggestions for prefix: '{}'", paginatedResponse.getContent().size(), prefix);

        return ResponseEntity.ok(
                AppResponse.<PaginatedResponse<HashtagResponseDTO>>builder()
                        .success(true)
                        .message("Hashtag suggestions retrieved successfully")
                        .data(paginatedResponse)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(HashtagRoutes.SUGGEST)
                        .build()
        );
    }

    @Override
    @DeleteMapping(HashtagRoutes.DELETE_HASHTAG)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AppResponse<Void>> deleteHashtag(
            @PathVariable Long hashtagId) {
        
        log.info("Admin request to delete hashtag with ID: {}", hashtagId);

        hashtagService.deleteHashtagById(hashtagId);

        log.info("Successfully deleted hashtag with ID: {}", hashtagId);

        return ResponseEntity.ok(
                AppResponse.<Void>builder()
                        .success(true)
                        .message("Hashtag deleted successfully")
                        .data(null)
                        .errors(Collections.emptyList())
                        .timestamp(Instant.now().toEpochMilli())
                        .path(HashtagRoutes.DELETE_HASHTAG.replace("{hashtagId}", hashtagId.toString()))
                        .build()
        );
    }
}
