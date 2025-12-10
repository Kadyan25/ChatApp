package com.example.ChatApp.controller;

import com.example.ChatApp.dto.ChatMessageRequest;
import com.example.ChatApp.dto.MessageDto;
import com.example.ChatApp.entity.Message;
import com.example.ChatApp.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request) {
        Message saved = chatService.saveMessage(
                request.getSenderId(),
                request.getRoomId(),
                request.getReceiverId(),
                request.getContent()
        );

        MessageDto dto = new MessageDto(
                saved.getId(),
                saved.getSender() != null ? saved.getSender().getId() : null,
                saved.getSender() != null ? saved.getSender().getUsername() : null,
                saved.getReceiver() != null ? saved.getReceiver().getId() : null,
                saved.getRoom() != null ? saved.getRoom().getId() : null,
                saved.getContent(),
                saved.getTimestamp()
        );

        if (request.getReceiverId() == null) {
            // Public room
            messagingTemplate.convertAndSend("/topic/room." + request.getRoomId(), dto);
        } else {
            // Private: send to sender and receiver queues
            messagingTemplate.convertAndSend("/queue/user." + saved.getSender().getId(), dto);
            messagingTemplate.convertAndSend("/queue/user." + saved.getReceiver().getId(), dto);
        }
    }


}
