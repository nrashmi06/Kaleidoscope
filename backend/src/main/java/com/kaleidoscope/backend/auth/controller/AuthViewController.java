package com.kaleidoscope.backend.auth.controller;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.users.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthViewController {

    UserService userService;

    public AuthViewController(UserService userService) {
        this.userService = userService;
    }


    @GetMapping(AuthRoutes.VERIFY_EMAIL)
    @PreAuthorize("permitAll()")
    public String verifyEmail(@RequestParam String token, Model model) {
        try {
            userService.verifyUser(token);
            model.addAttribute("message", "Email verified successfully.");
            return "emailVerified"; // Name of the HTML view
        } catch (Exception e) {
            model.addAttribute("message", "Email verification failed: " + e.getMessage());
            return "emailVerificationError"; // Name of the error HTML view
        }
    }

}
