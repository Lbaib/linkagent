package com.linkedagent.chatserver.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String connectionId = connectionId(session);
        if (connectionId != null) {
            sessions.put(connectionId, session);
            log.info("WebSocket connected: {} ({})", connectionId, role(session));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String connectionId = connectionId(session);
        if (connectionId == null) {
            return;
        }
        String payload = message.getPayload();
        try {
            JsonNode frame = objectMapper.readTree(payload);
            if (!frame.hasNonNull("type")) {
                log.warn("Dropping frame without type from {}", connectionId);
                return;
            }
            publishUpstream(connectionId, role(session), payload);
        } catch (Exception e) {
            log.warn("Dropping malformed frame from {}: {}", connectionId, e.getMessage());
        }
    }

    /** Invoked by MessageListenerAdapter for the downstream channel. */
    public void handleRedisMessage(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String targetId = node.path("targetId").asText(null);
            String frame = node.path("frame").asText(null);
            if (targetId == null || frame == null) {
                return;
            }
            WebSocketSession target = sessions.get(targetId);
            if (target != null && target.isOpen()) {
                target.sendMessage(new TextMessage(frame));
            }
        } catch (Exception e) {
            log.warn("Failed to deliver downstream message: {}", e.getMessage());
        }
    }

    @Override
    protected void handlePongMessage(WebSocketSession session, PongMessage message) {
        log.debug("Pong from {}", connectionId(session));
    }

    @Scheduled(fixedRate = 30000)
    public void sendPings() {
        PingMessage ping = new PingMessage();
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(ping);
                }
            } catch (Exception e) {
                log.debug("Ping failed, session will be cleaned up on close");
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String connectionId = connectionId(session);
        if (connectionId == null) {
            return;
        }
        sessions.remove(connectionId);
        log.info("WebSocket closed: {} ({})", connectionId, status.getCode());
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", WsFrames.DISCONNECT);
        publishUpstream(connectionId, role(session), frame.toString());
    }

    private void publishUpstream(String connectionId, String role, String frameJson) {
        ObjectNode envelope = objectMapper.createObjectNode();
        envelope.put("connectionId", connectionId);
        envelope.put("role", role);
        envelope.put("frame", frameJson);
        redisTemplate.convertAndSend(ChatChannels.UPSTREAM, envelope.toString());
    }

    private String connectionId(WebSocketSession session) {
        return (String) session.getAttributes().get(JwtWebSocketInterceptor.ATTR_CONNECTION_ID);
    }

    private String role(WebSocketSession session) {
        Object role = session.getAttributes().get(JwtWebSocketInterceptor.ATTR_ROLE);
        return role == null ? JwtRoles.VISITOR : (String) role;
    }
}
