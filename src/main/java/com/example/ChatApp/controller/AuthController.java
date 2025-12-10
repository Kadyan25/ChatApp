package com.example.ChatApp.controller;

import com.example.ChatApp.dto.AuthResponse;
import com.example.ChatApp.dto.LoginRequest;
import com.example.ChatApp.dto.RegisterRequest;
import com.example.ChatApp.entity.User;
import com.example.ChatApp.security.JwtUtil;
import com.example.ChatApp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        userService.register(request);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = userService.authenticate(request);
        String token = jwtUtil.generateToken(user);
        AuthResponse response = new AuthResponse(user.getId(), user.getUsername(), token);
        return ResponseEntity.ok(response);
    }
}
