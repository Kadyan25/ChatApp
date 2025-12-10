package com.example.ChatApp.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageRequest {
    private Long roomId;
    private Long receiverId; // optional, null for public
    private String content;
}
