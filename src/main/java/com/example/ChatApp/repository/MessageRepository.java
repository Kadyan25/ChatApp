package com.example.ChatApp.repository;

import com.example.ChatApp.entity.Message;
import com.example.ChatApp.entity.User;
import com.example.ChatApp.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRoomOrderByTimestampAsc(ChatRoom room);

    List<Message> findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
            User sender, User receiver,
            User receiver2, User sender2
    );
}