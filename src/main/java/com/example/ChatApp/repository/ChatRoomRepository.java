package com.example.ChatApp.repository;

import com.example.ChatApp.entity.ChatRoom;
import com.example.ChatApp.entity.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    List<ChatRoom> findByType(ChatRoomType type);
}
