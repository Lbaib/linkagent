package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import com.linkedagent.customerservice.client.AiRagClient;
import com.linkedagent.customerservice.service.RoutingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatOrchestrationServiceTest {

    private ChatOrchestrationService service;
    private ChatDownstreamPublisher publisher;
    private RoutingService routingService;
    private AiRagClient aiRagClient;
    private ListOperations<String, String> listOps;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        service = new ChatOrchestrationService();
        publisher = mock(ChatDownstreamPublisher.class);
        routingService = mock(RoutingService.class);
        aiRagClient = mock(AiRagClient.class);
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        listOps = mock(ListOperations.class);
        when(redisTemplate.opsForList()).thenReturn(listOps);
        ReflectionTestUtils.setField(service, "publisher", publisher);
        ReflectionTestUtils.setField(service, "routingService", routingService);
        ReflectionTestUtils.setField(service, "aiRagClient", aiRagClient);
        ReflectionTestUtils.setField(service, "redisTemplate", redisTemplate);
    }

    private List<JsonNode> framesSentTo(String targetId) {
        ArgumentCaptor<String> target = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> frame = ArgumentCaptor.forClass(String.class);
        verify(publisher, atLeastOnce()).send(target.capture(), frame.capture());
        List<JsonNode> frames = new ArrayList<>();
        for (int i = 0; i < target.getAllValues().size(); i++) {
            if (targetId.equals(target.getAllValues().get(i))) {
                try {
                    frames.add(objectMapper.readTree(frame.getAllValues().get(i)));
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                }
            }
        }
        return frames;
    }

    private int streamChunkSize() {
        return (Integer) ReflectionTestUtils.getField(service, "STREAM_CHUNK_SIZE");
    }

    @Test
    void visitorChatStreamsAiAnswer() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenReturn(Map.of("success", true, "answer", "退货政策是七天无理由。"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"退货政策?\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().allMatch(f -> WsFrames.AI_STREAM.equals(f.get("type").asText())));
        JsonNode last = frames.get(frames.size() - 1);
        assertTrue(last.get("payload").get("isDone").asBoolean());
        assertEquals("退货政策是七天无理由。", last.get("payload").get("text").asText());
        assertFalse(frames.get(0).get("payload").get("isDone").asBoolean());
    }

    @Test
    void aiAnswerShorterThanChunkStreamsOneCompletedFrame() {
        String answer = "x".repeat(streamChunkSize() - 1);
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenReturn(Map.of("success", true, "answer", answer));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"问题\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertEquals(1, frames.size());
        assertEquals(WsFrames.AI_STREAM, frames.get(0).get("type").asText());
        assertEquals(answer, frames.get(0).get("payload").get("text").asText());
        assertTrue(frames.get(0).get("payload").get("isDone").asBoolean());
    }

    @Test
    void aiAnswerAtExactChunkMultipleStreamsOnlyFinalFrameAsDone() {
        String answer = "x".repeat(streamChunkSize() * 2);
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenReturn(Map.of("success", true, "answer", answer));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"问题\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertEquals(answer.length() / streamChunkSize(), frames.size());
        assertTrue(frames.subList(0, frames.size() - 1).stream()
                .allMatch(frame -> !frame.get("payload").get("isDone").asBoolean()));
        JsonNode finalFrame = frames.get(frames.size() - 1);
        assertTrue(finalFrame.get("payload").get("isDone").asBoolean());
        assertEquals(answer, finalFrame.get("payload").get("text").asText());
    }

    @Test
    void aiFailureProducesErrorFrameAndNoFakeAnswer() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenThrow(new RuntimeException("connection refused"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"退货政策?\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertEquals(1, frames.size());
        assertEquals(WsFrames.ERROR, frames.get(0).get("type").asText());
        assertEquals("AI_UNAVAILABLE", frames.get(0).get("payload").get("code").asText());
    }

    @Test
    void visitorChatIsForwardedToBoundAgent() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"在吗\"}}");

        JsonNode frame = framesSentTo("agent_1").get(0);
        assertEquals(WsFrames.CHAT, frame.get("type").asText());
        assertEquals("visitor", frame.get("payload").get("sender").asText());
        assertEquals("visitor_abc", frame.get("payload").get("visitorId").asText());
        assertEquals("在吗", frame.get("payload").get("text").asText());
    }

    @Test
    void transferWithOnlineAgentMovesBothSidesToAgentChat() {
        when(routingService.assignAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"TRANSFER_AGENT\"}");

        JsonNode visitorFrame = framesSentTo("visitor_abc").stream()
                .filter(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText()))
                .reduce((first, second) -> second)
                .orElseThrow();
        assertEquals("agent_chat", visitorFrame.get("payload").get("status").asText());

        JsonNode agentFrame = framesSentTo("agent_1").stream()
                .filter(f -> WsFrames.SESSION_OFFER.equals(f.get("type").asText()))
                .findFirst()
                .orElseThrow();
        assertEquals("visitor_abc", agentFrame.get("payload").get("visitorId").asText());
    }

    @Test
    void transferWithoutAgentKeepsVisitorQueuing() {
        when(routingService.assignAgent("visitor_abc")).thenReturn(Optional.empty());

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"TRANSFER_AGENT\"}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().anyMatch(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText())
                && "queuing".equals(f.get("payload").get("status").asText())));
        assertTrue(frames.stream().anyMatch(f -> WsFrames.CHAT.equals(f.get("type").asText())
                && "system".equals(f.get("payload").get("sender").asText())));
        verify(routingService).markQueueing("visitor_abc");
    }

    @Test
    void agentReadyRegistersAgent() {
        service.handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"AGENT_READY\"}");

        verify(routingService).registerAgent("agent_1");
    }

    @Test
    void visitorCannotRegisterAsAgent() {
        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"AGENT_READY\"}");

        verify(routingService, never()).registerAgent(anyString());
        verify(publisher, never()).send(anyString(), anyString());
    }

    @Test
    void agentCannotTransferItselfToAgentQueue() {
        service.handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"TRANSFER_AGENT\"}");

        verify(routingService, never()).assignAgent(anyString());
        verify(publisher, never()).send(anyString(), anyString());
    }

    @Test
    void agentChatIsForwardedToVisitor() {
        service.handleUpstream("agent_1", JwtRoles.AGENT,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"您好\",\"visitorId\":\"visitor_abc\"}}");

        JsonNode frame = framesSentTo("visitor_abc").get(0);
        assertEquals(WsFrames.CHAT, frame.get("type").asText());
        assertEquals("agent", frame.get("payload").get("sender").asText());
        assertEquals("您好", frame.get("payload").get("text").asText());
    }

    @Test
    void agentDisconnectPutsVisitorsBackToQueuing() {
        when(routingService.unregisterAgent("agent_1")).thenReturn(Set.of("visitor_abc"));

        service.handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"DISCONNECT\"}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().anyMatch(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText())
                && "queuing".equals(f.get("payload").get("status").asText())));
    }

    @Test
    void visitorDisconnectReleasesBinding() {
        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"DISCONNECT\"}");

        verify(routingService).releaseVisitor("visitor_abc");
    }

    @Test
    void malformedFrameIsIgnored() {
        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "not-json");

        verify(publisher, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    void chatMessagesAreBufferedForPersistence() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"在吗\"}}");
        service.handleUpstream("agent_1", JwtRoles.AGENT,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"您好\",\"visitorId\":\"visitor_abc\"}}");

        verify(listOps).rightPush("chat:messages", "visitor_abc:在吗");
        verify(listOps).rightPush("chat:messages", "visitor_abc:您好");
    }
}
