package com.example.ChatApp.controller;

import com.example.ChatApp.dto.UserPresenceDto;
import com.example.ChatApp.entity.User;
import com.example.ChatApp.repository.UserRepository;
import com.example.ChatApp.util.OnlineUserTracker;

import lombok.RequiredArgsConstructor;

import java.util.Comparator;
import java.util.List;
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

    @GetMapping("/presence")
    public ResponseEntity<List<UserPresenceDto>> getUserPresence(Authentication authentication) {
        String currentUsername = (String) authentication.getPrincipal();
        Set<Long> onlineUserIds = onlineUserTracker.getOnlineUsers();

        List<UserPresenceDto> users = userRepository.findAll().stream()
                .filter(user -> !user.getUsername().equals(currentUsername))
                .map(user -> new UserPresenceDto(
                        user.getId(),
                        user.getUsername(),
                        onlineUserIds.contains(user.getId())
                ))
                .sorted(
                        Comparator.comparing(UserPresenceDto::online).reversed()
                                .thenComparing(UserPresenceDto::username, String.CASE_INSENSITIVE_ORDER)
                )
                .toList();

        return ResponseEntity.ok(users);
    }

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
