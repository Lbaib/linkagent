package com.linkedagent.chatserver.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.chatserver.config.RedisPubSubConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
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

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String visitorId = (String) session.getAttributes().get("visitorId");
        if (visitorId != null) {
            sessions.put(visitorId, session);
            System.out.println("Connection established for visitor: " + visitorId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String visitorId = (String) session.getAttributes().get("visitorId");
        String payload = message.getPayload();
        
        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String type = jsonNode.has("type") ? jsonNode.get("type").asText() : "";
            
            if ("direct".equals(type) && jsonNode.has("to")) {
                String targetId = jsonNode.get("to").asText();
                // Publish to Redis Pub/Sub for distributed routing
                ObjectNode publishMsg = objectMapper.createObjectNode();
                publishMsg.put("targetId", targetId);
                publishMsg.put("from", visitorId);
                publishMsg.put("content", payload);
                redisTemplate.convertAndSend(RedisPubSubConfig.CHAT_TOPIC, publishMsg.toString());
            } else {
                // Buffer to Redis for saving
                redisTemplate.opsForList().rightPush("chat:messages", visitorId + ":" + payload);
            }
        } catch (Exception e) {
            System.err.println("Invalid message format: " + payload);
        }
    }

    // Method called by RedisMessageListenerAdapter
    public void handleRedisMessage(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String targetId = jsonNode.get("targetId").asText();
            String content = jsonNode.get("content").asText();
            
            WebSocketSession targetSession = sessions.get(targetId);
            if (targetSession != null && targetSession.isOpen()) {
                targetSession.sendMessage(new TextMessage(content));
            }
        } catch (Exception e) {
            System.err.println("Failed to handle redis pubsub msg: " + e.getMessage());
        }
    }

    @Override
    protected void handlePongMessage(WebSocketSession session, PongMessage message) throws Exception {
        System.out.println("Received pong from session: " + session.getId());
    }

    // 6.3 Proactive keep-alive Ping
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 30000)
    public void sendPings() {
        PingMessage pingMessage = new PingMessage();
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(pingMessage);
                }
            } catch (Exception e) {
                // Ignore, will be cleaned up on close
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String visitorId = (String) session.getAttributes().get("visitorId");
        if (visitorId != null) {
            sessions.remove(visitorId);
            System.out.println("Connection closed for visitor: " + visitorId);
        }
    }
}
