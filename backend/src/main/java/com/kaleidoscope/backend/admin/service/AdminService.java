package com.kaleidoscope.backend.admin.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AdminService {
    void sendMassEmail(String subject, String body, List<com.kaleidoscope.backend.shared.enums.Role> targetRoles, List<MultipartFile> attachments);
}
