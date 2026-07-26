package com.linkedagent.customerservice.chat;

import com.linkedagent.common.constant.JwtRoles;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ChatUpstreamListenerTest {

    private ChatUpstreamListener listener;
    private ChatOrchestrationService orchestrationService;

    @BeforeEach
    void setUp() {
        listener = new ChatUpstreamListener();
        orchestrationService = mock(ChatOrchestrationService.class);
        ReflectionTestUtils.setField(listener, "orchestrationService", orchestrationService);
    }

    @Test
    void visitorEnvelopeReachesOrchestration() {
        listener.handleUpstreamMessage("""
                {"connectionId":"visitor_abc","role":"visitor","frame":"{\\"type\\":\\"CHAT\\"}"}
                """);

        verify(orchestrationService).handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"CHAT\"}");
    }

    @Test
    void agentEnvelopeReachesOrchestration() {
        listener.handleUpstreamMessage("""
                {"connectionId":"agent_1","role":"agent","frame":"{\\"type\\":\\"AGENT_READY\\"}"}
                """);

        verify(orchestrationService).handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"AGENT_READY\"}");
    }

    @Test
    void envelopeWithoutRoleDoesNotReachOrchestration() {
        listener.handleUpstreamMessage("""
                {"connectionId":"visitor_abc","frame":"{\\"type\\":\\"CHAT\\"}"}
                """);

        verify(orchestrationService, never()).handleUpstream(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void envelopeWithUnrecognizedRoleDoesNotReachOrchestration() {
        listener.handleUpstreamMessage("""
                {"connectionId":"visitor_abc","role":"admin","frame":"{\\"type\\":\\"CHAT\\"}"}
                """);

        verify(orchestrationService, never()).handleUpstream(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
    }
}
