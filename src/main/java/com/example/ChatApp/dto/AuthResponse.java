package com.example.ChatApp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String username;
    private String token; // will be filled once JWT is added
}
