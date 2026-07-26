package com.linkedagent.chatserver.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatWebSocketHandlerTest {

    private ChatWebSocketHandler handler;
    private StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private WebSocketSession session(String connectionId, String role) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(JwtWebSocketInterceptor.ATTR_CONNECTION_ID, connectionId);
        attributes.put(JwtWebSocketInterceptor.ATTR_ROLE, role);
        when(session.getAttributes()).thenReturn(attributes);
        when(session.isOpen()).thenReturn(true);
        return session;
    }

    @BeforeEach
    void setUp() {
        handler = new ChatWebSocketHandler();
        redisTemplate = mock(StringRedisTemplate.class);
        ReflectionTestUtils.setField(handler, "redisTemplate", redisTemplate);
    }

    @Test
    void incomingFrameIsPublishedUpstreamWithIdentity() throws Exception {
        WebSocketSession session = session("visitor_abc", JwtRoles.VISITOR);
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, new TextMessage("{\"type\":\"CHAT\",\"payload\":{\"text\":\"hi\"}}"));

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(eq(ChatChannels.UPSTREAM), captor.capture());

        JsonNode envelope = objectMapper.readTree(captor.getValue());
        assertEquals("visitor_abc", envelope.get("connectionId").asText());
        assertEquals(JwtRoles.VISITOR, envelope.get("role").asText());
        assertEquals("CHAT", objectMapper.readTree(envelope.get("frame").asText()).get("type").asText());
    }

    @Test
    void downstreamMessageIsDeliveredToTargetSession() throws Exception {
        WebSocketSession session = session("visitor_abc", JwtRoles.VISITOR);
        handler.afterConnectionEstablished(session);

        String frame = "{\"type\":\"AI_STREAM\",\"payload\":{\"text\":\"hello\",\"isDone\":true}}";
        handler.handleRedisMessage(objectMapper.createObjectNode()
                .put("targetId", "visitor_abc")
                .put("frame", frame)
                .toString());

        verify(session).sendMessage(new TextMessage(frame));
    }

    @Test
    void downstreamMessageForUnknownTargetIsIgnored() throws Exception {
        handler.handleRedisMessage(objectMapper.createObjectNode()
                .put("targetId", "visitor_missing")
                .put("frame", "{\"type\":\"CHAT\"}")
                .toString());

        verify(redisTemplate, never()).convertAndSend(anyString(), anyString());
    }

    @Test
    void closingConnectionPublishesDisconnectFrame() throws Exception {
        WebSocketSession session = session("agent_1", JwtRoles.AGENT);
        handler.afterConnectionEstablished(session);

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(eq(ChatChannels.UPSTREAM), captor.capture());

        JsonNode envelope = objectMapper.readTree(captor.getValue());
        assertEquals("agent_1", envelope.get("connectionId").asText());
        assertEquals(WsFrames.DISCONNECT,
                objectMapper.readTree(envelope.get("frame").asText()).get("type").asText());
    }
}
