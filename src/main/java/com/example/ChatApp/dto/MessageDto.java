package com.example.ChatApp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private Long receiverId;   // nullable
    private Long roomId;
    private String content;
    private Instant timestamp;
}
