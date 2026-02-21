package com.example.ChatApp.dto;

public record UserPresenceDto(
        Long id,
        String username,
        boolean online
) {
}
