package com.example.ChatApp.service;

import com.example.ChatApp.dto.MessageDto;
import com.example.ChatApp.entity.ChatRoom;
import com.example.ChatApp.entity.ChatRoomType;
import com.example.ChatApp.entity.Message;
import com.example.ChatApp.entity.User;
import com.example.ChatApp.repository.ChatRoomRepository;
import com.example.ChatApp.repository.MessageRepository;
import com.example.ChatApp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public List<ChatRoom> getPublicRooms() {
        return chatRoomRepository.findByType(ChatRoomType.PUBLIC);
    }

//    public List<Message> getMessagesForRoom(Long roomId) {
//        ChatRoom room = chatRoomRepository.findById(roomId)
//                .orElseThrow(() -> new RuntimeException("Room not found"));
//        return messageRepository.findByRoomOrderByTimestampAsc(room);
//    }

    public List<MessageDto> getMessagesForRoomDto(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        List<Message> messages = messageRepository.findByRoomOrderByTimestampAsc(room);

        return messages.stream()
                .map(m -> new MessageDto(
                        m.getId(),
                        m.getSender() != null ? m.getSender().getId() : null,
                        m.getSender() != null ? m.getSender().getUsername() : null,
                        m.getReceiver() != null ? m.getReceiver().getId() : null,
                        m.getRoom() != null ? m.getRoom().getId() : null,
                        m.getContent(),
                        m.getTimestamp()
                ))
                .toList();
    }
    
    public List<MessageDto> getPrivateMessagesDto(Long user1Id, Long user2Id) {
        User u1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User u2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Message> messages = messageRepository
                .findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(u1, u2, u1, u2);

        return messages.stream()
                .map(m -> new MessageDto(
                        m.getId(),
                        m.getSender() != null ? m.getSender().getId() : null,
                        m.getSender() != null ? m.getSender().getUsername() : null,
                        m.getReceiver() != null ? m.getReceiver().getId() : null,
                        m.getRoom() != null ? m.getRoom().getId() : null,
                        m.getContent(),
                        m.getTimestamp()
                ))
                .toList();
    }

    public Long getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    public Message saveMessage(Long senderId, Long roomId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
//        ChatRoom room = chatRoomRepository.findById(roomId)
//                .orElseThrow(() -> new RuntimeException("Room not found"));

        Message message = new Message();
        message.setSender(sender);
        if (roomId != null) {
            ChatRoom room = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Room not found"));
            message.setRoom(room);
        }
        if (receiverId != null) {
            User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
            message.setReceiver(receiver);
        }
        message.setContent(content);

        return messageRepository.save(message);
    }


    public ChatRoom createPublicRoom(String name) {
        ChatRoom room = new ChatRoom();
        room.setName(name);
        room.setType(ChatRoomType.PUBLIC);
        return chatRoomRepository.save(room);
    }
}
