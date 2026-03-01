package com.kaleidoscope.backend.admin.service;

import com.kaleidoscope.backend.shared.enums.Role;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AdminService {
    void sendMassEmail(String subject, String body, List<Role> targetRoles, List<MultipartFile> attachments);
}
