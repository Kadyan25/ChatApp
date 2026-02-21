package com.example.ChatApp.config;

import com.example.ChatApp.security.JwtUtil;
import com.example.ChatApp.util.OnlineUserTracker;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {

    private final JwtUtil jwtUtil;
    private final OnlineUserTracker onlineUserTracker;
    private final Map<String, Long> sessionToUser = new ConcurrentHashMap<>();
    private final Map<Long, AtomicInteger> userConnectionCount = new ConcurrentHashMap<>();

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            return;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.getUserIdFromToken(token);
                Long existing = sessionToUser.putIfAbsent(sessionId, userId);
                if (existing == null) {
                    int count = userConnectionCount
                            .computeIfAbsent(userId, id -> new AtomicInteger(0))
                            .incrementAndGet();
                    if (count == 1) {
                        onlineUserTracker.userConnected(userId);
                    }
                }
            }
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            return;
        }

        Long userId = sessionToUser.remove(sessionId);
        if (userId == null) {
            return;
        }

        AtomicInteger counter = userConnectionCount.get(userId);
        if (counter != null) {
            int remaining = counter.decrementAndGet();
            if (remaining <= 0) {
                userConnectionCount.remove(userId, counter);
                onlineUserTracker.userDisconnected(userId);
            }
        }
    }
}
