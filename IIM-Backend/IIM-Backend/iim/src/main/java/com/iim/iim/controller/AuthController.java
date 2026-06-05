package com.iim.iim.controller;

import com.iim.iim.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.iim.iim.dto.*;
import com.iim.iim.service.AuthService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@CrossOrigin
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public AuthResponse register(
            @ModelAttribute RegisterRequest request,
            @RequestParam(value="image", required=false) MultipartFile image
    ) {
        return service.register(request, image);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        return service.login(request);
    }
}