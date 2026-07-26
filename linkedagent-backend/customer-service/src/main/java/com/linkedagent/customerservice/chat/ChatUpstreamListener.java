package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.JwtRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ChatUpstreamListener {

    private static final Logger log = LoggerFactory.getLogger(ChatUpstreamListener.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatOrchestrationService orchestrationService;

    /** Invoked by MessageListenerAdapter for the upstream channel. */
    public void handleUpstreamMessage(String message) {
        try {
            JsonNode envelope = objectMapper.readTree(message);
            String connectionId = envelope.path("connectionId").asText(null);
            String frame = envelope.path("frame").asText(null);
            if (connectionId == null || frame == null) {
                return;
            }
            String role = envelope.path("role").asText(JwtRoles.VISITOR);
            orchestrationService.handleUpstream(connectionId, role, frame);
        } catch (Exception e) {
            log.warn("Failed to process upstream envelope: {}", e.getMessage());
        }
    }
}
