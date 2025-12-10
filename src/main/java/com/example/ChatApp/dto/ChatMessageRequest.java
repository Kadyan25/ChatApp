package com.example.ChatApp.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatMessageRequest {
    private Long roomId;
    private Long receiverId; // null for public room
    private Long senderId;  // add this
    private String content;
}
