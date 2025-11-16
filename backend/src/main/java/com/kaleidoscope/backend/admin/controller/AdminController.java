package com.kaleidoscope.backend.admin.controller;

import com.kaleidoscope.backend.admin.controller.api.AdminApi;
import com.kaleidoscope.backend.admin.dto.request.MassEmailRequestDTO;
import com.kaleidoscope.backend.admin.routes.AdminRoutes;
import com.kaleidoscope.backend.admin.service.AdminService;
import com.kaleidoscope.backend.shared.response.AppResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AdminController implements AdminApi {

    private final AdminService adminService;

    @Override
    public ResponseEntity<AppResponse<Object>> sendMassEmail(
        @Valid @RequestPart("emailData") MassEmailRequestDTO request,
        @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments
    ) {
        log.info("Admin request received to send mass email to roles: {} with subject: {}", request.targetRoles(), request.subject());

        adminService.sendMassEmail(request.subject(), request.body(), request.targetRoles(), attachments);

        return ResponseEntity.ok(AppResponse.success(
            null,
            "Mass email job started successfully. Emails will be sent in the background.",
            AdminRoutes.SEND_MASS_EMAIL
        ));
    }
}
