package com.example.ChatApp.service;

import com.example.ChatApp.dto.LoginRequest;
import com.example.ChatApp.dto.RegisterRequest;
import com.example.ChatApp.dto.AuthResponse;
import com.example.ChatApp.entity.User;
import com.example.ChatApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void register(RegisterRequest request) {
        // basic uniqueness check
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
    }

    public User authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return user;
    }

    // later this will return AuthResponse with JWT
    public AuthResponse login(LoginRequest request, String token) {
        User user = authenticate(request);
        return new AuthResponse(user.getId(), user.getUsername(), token);
    }
}
