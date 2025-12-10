package com.example.ChatApp.controller;

import com.example.ChatApp.entity.User;
import com.example.ChatApp.repository.UserRepository;
import com.example.ChatApp.util.OnlineUserTracker;

import lombok.RequiredArgsConstructor;

import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    
    private final OnlineUserTracker onlineUserTracker;

    @GetMapping("/online")
    public ResponseEntity<Set<Long>> getOnlineUsers() {
        return ResponseEntity.ok(onlineUserTracker.getOnlineUsers());
    }

 // TEMP: mark a user as online for testing
    @PostMapping("/online/{userId}")
    public ResponseEntity<Void> markOnline(@PathVariable Long userId) {
        onlineUserTracker.userConnected(userId);
        return ResponseEntity.ok().build();
    }

 // TEMP: mark a user as offline for testing
 @DeleteMapping("/online/{userId}")
 public ResponseEntity<Void> markOffline(@PathVariable Long userId) {
     onlineUserTracker.userDisconnected(userId);
     return ResponseEntity.ok().build();
 }
    @GetMapping("/me")
    public ResponseEntity<User> me(Authentication authentication) {
        String username = (String) authentication.getPrincipal();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // You can create a DTO later; for now returning entity is fine for testing
        return ResponseEntity.ok(user);
    }
}
