package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import com.linkedagent.customerservice.client.AiRagClient;
import com.linkedagent.customerservice.service.RoutingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ChatOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(ChatOrchestrationService.class);
    private static final int STREAM_CHUNK_SIZE = 6;
    private static final String MESSAGE_BUFFER_KEY = "chat:messages";
    private static final String NO_AGENT_HINT = "当前暂无客服在线，您可以继续与 AI 对话，我们会在客服上线后为您接入。";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatDownstreamPublisher publisher;

    @Autowired
    private RoutingService routingService;

    @Autowired
    private AiRagClient aiRagClient;

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void handleUpstream(String connectionId, String role, String frameJson) {
        JsonNode frame;
        try {
            frame = objectMapper.readTree(frameJson);
        } catch (Exception e) {
            log.warn("Ignoring malformed upstream frame from {}", connectionId);
            return;
        }
        String type = frame.path("type").asText("");
        JsonNode payload = frame.path("payload");
        boolean isAgent = JwtRoles.AGENT.equals(role);
        boolean isVisitor = JwtRoles.VISITOR.equals(role);

        switch (type) {
            case WsFrames.CHAT -> {
                if (isAgent) {
                    handleAgentChat(connectionId, payload);
                } else {
                    handleVisitorChat(connectionId, payload);
                }
            }
            case WsFrames.TRANSFER_AGENT -> {
                if (isVisitor) {
                    handleTransfer(connectionId);
                } else {
                    log.warn("Ignoring TRANSFER_AGENT from non-visitor connection {}", connectionId);
                }
            }
            case WsFrames.AGENT_READY -> {
                if (isAgent) {
                    routingService.registerAgent(connectionId);
                } else {
                    log.warn("Ignoring AGENT_READY from non-agent connection {}", connectionId);
                }
            }
            case WsFrames.DISCONNECT -> handleDisconnect(connectionId, isAgent);
            default -> log.debug("Unhandled frame type {} from {}", type, connectionId);
        }
    }

    private void handleVisitorChat(String visitorId, JsonNode payload) {
        String text = payload.path("text").asText("");
        if (text.isBlank()) {
            return;
        }
        bufferForPersistence(visitorId, text);
        Optional<String> boundAgent = routingService.getBoundAgent(visitorId);
        if (boundAgent.isPresent()) {
            publisher.send(boundAgent.get(), chatFrame("visitor", text, visitorId));
            return;
        }
        streamAiAnswer(visitorId, text);
    }

    private void handleAgentChat(String agentId, JsonNode payload) {
        String text = payload.path("text").asText("");
        String visitorId = payload.path("visitorId").asText("");
        if (text.isBlank() || visitorId.isBlank()) {
            log.warn("Agent {} sent a chat frame without text or visitorId", agentId);
            return;
        }
        bufferForPersistence(visitorId, text);
        publisher.send(visitorId, chatFrame("agent", text, visitorId));
    }

    /** Keeps the existing MessagePersistenceTask fed now that chat-server no longer buffers. */
    private void bufferForPersistence(String visitorId, String text) {
        redisTemplate.opsForList().rightPush(MESSAGE_BUFFER_KEY, visitorId + ":" + text);
    }

    private void handleTransfer(String visitorId) {
        Optional<String> agentId = routingService.assignAgent(visitorId);
        if (agentId.isPresent()) {
            publisher.send(visitorId, statusFrame("agent_chat"));
            publisher.send(agentId.get(), sessionOfferFrame(visitorId));
            publisher.send(agentId.get(), statusFrame("agent_chat"));
            return;
        }
        routingService.markQueueing(visitorId);
        publisher.send(visitorId, statusFrame("queuing"));
        publisher.send(visitorId, chatFrame("system", NO_AGENT_HINT, visitorId));
    }

    private void handleDisconnect(String connectionId, boolean isAgent) {
        if (isAgent) {
            Set<String> released = routingService.unregisterAgent(connectionId);
            for (String visitorId : released) {
                publisher.send(visitorId, statusFrame("queuing"));
                publisher.send(visitorId, chatFrame("system", "客服已离线，正在为您重新排队。", visitorId));
            }
            return;
        }
        routingService.releaseVisitor(connectionId);
    }

    private void streamAiAnswer(String visitorId, String question) {
        String answer;
        try {
            Map<String, String> body = new HashMap<>();
            body.put("query", question);
            body.put("sessionId", visitorId);
            Map<String, Object> response = aiRagClient.ask(body);
            Object success = response == null ? null : response.get("success");
            Object content = response == null ? null : response.get("answer");
            if (!Boolean.TRUE.equals(success) || !(content instanceof String) || ((String) content).isBlank()) {
                publisher.send(visitorId, errorFrame("AI_UNAVAILABLE", "AI 服务暂不可用，请稍后重试或转人工。"));
                return;
            }
            answer = (String) content;
        } catch (Exception e) {
            log.warn("AI call failed for {}: {}", visitorId, e.getMessage());
            publisher.send(visitorId, errorFrame("AI_UNAVAILABLE", "AI 服务暂不可用，请稍后重试或转人工。"));
            return;
        }

        for (int end = Math.min(STREAM_CHUNK_SIZE, answer.length()); end < answer.length(); end += STREAM_CHUNK_SIZE) {
            publisher.send(visitorId, aiStreamFrame(answer.substring(0, end), false));
        }
        publisher.send(visitorId, aiStreamFrame(answer, true));
    }

    private String chatFrame(String sender, String text, String visitorId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("sender", sender);
        payload.put("text", text);
        payload.put("visitorId", visitorId);
        return frame(WsFrames.CHAT, payload);
    }

    private String aiStreamFrame(String text, boolean isDone) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("text", text);
        payload.put("isDone", isDone);
        return frame(WsFrames.AI_STREAM, payload);
    }

    private String statusFrame(String status) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("status", status);
        return frame(WsFrames.STATUS_UPDATE, payload);
    }

    private String sessionOfferFrame(String visitorId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("visitorId", visitorId);
        return frame(WsFrames.SESSION_OFFER, payload);
    }

    private String errorFrame(String code, String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("code", code);
        payload.put("message", message);
        return frame(WsFrames.ERROR, payload);
    }

    private String frame(String type, ObjectNode payload) {
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", type);
        frame.set("payload", payload);
        return frame.toString();
    }
}
