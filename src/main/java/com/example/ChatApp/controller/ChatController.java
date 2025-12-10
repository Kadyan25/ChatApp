package com.example.ChatApp.controller;

import com.example.ChatApp.dto.MessageDto;
import com.example.ChatApp.dto.MessageRequest;
import com.example.ChatApp.entity.ChatRoom;
import com.example.ChatApp.entity.Message;
import com.example.ChatApp.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatRoom>> getRooms() {
        List<ChatRoom> rooms = chatService.getPublicRooms();
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<MessageDto>> getRoomMessages(@PathVariable Long roomId) {
        List<MessageDto> messages = chatService.getMessagesForRoomDto(roomId);
        return ResponseEntity.ok(messages);
    }


    @GetMapping("/private/{otherUserId}/messages")
    public ResponseEntity<List<MessageDto>> getPrivateMessages(
            Authentication authentication,
            @PathVariable Long otherUserId
    ) {
        String username = (String) authentication.getPrincipal();
        Long currentUserId = chatService.getUserIdByUsername(username);
        List<MessageDto> messages = chatService.getPrivateMessagesDto(currentUserId, otherUserId);
        return ResponseEntity.ok(messages);
    }

    
    @PostMapping("/messages")
    public ResponseEntity<MessageDto> sendMessageRest(
            Authentication authentication,
            @RequestBody MessageRequest request
    ) {
        String username = (String) authentication.getPrincipal();
        Long senderId = chatService.getUserIdByUsername(username);

        Message saved = chatService.saveMessage(
                senderId,
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

        return ResponseEntity.ok(dto);
    }



}
