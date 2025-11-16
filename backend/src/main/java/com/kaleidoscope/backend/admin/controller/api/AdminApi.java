package com.kaleidoscope.backend.admin.controller.api;

import com.kaleidoscope.backend.admin.dto.request.MassEmailRequestDTO;
import com.kaleidoscope.backend.admin.routes.AdminRoutes;
import com.kaleidoscope.backend.shared.response.AppResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Admin", description = "Site-wide administrative operations")
public interface AdminApi {

    @Operation(
        summary = "Send mass email (Admin)",
        description = "Sends a bulk email with optional attachments to all ACTIVE users belonging to the selected roles (ADMIN, MODERATOR, USER). This bypasses user notification preferences and is for emergency use only."
    )
    @ApiResponse(responseCode = "200", description = "Mass email job started successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden (Admin role required)")
    @PostMapping(value = AdminRoutes.SEND_MASS_EMAIL, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<AppResponse<Object>> sendMassEmail(
        @Parameter(
            description = "Email payload: subject (string), body (HTML string), and targetRoles (array of roles: ADMIN, MODERATOR, USER).",
            required = true,
            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                schema = @Schema(implementation = MassEmailRequestDTO.class))
        )
        @Valid @RequestPart("emailData") MassEmailRequestDTO request,

        @Parameter(
            description = "Optional file attachments (one or many).",
            content = @Content(
                mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE,
                array = @ArraySchema(schema = @Schema(type = "string", format = "binary"))
            )
        )
        @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments
    );
}
