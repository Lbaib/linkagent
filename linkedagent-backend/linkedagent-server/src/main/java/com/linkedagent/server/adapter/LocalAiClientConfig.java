package com.linkedagent.server.adapter;

import com.linkedagent.airagservice.service.AiRagService;
import com.linkedagent.customerservice.client.AiRagClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class LocalAiClientConfig {

    @Bean
    public AiRagClient aiRagClient(AiRagService aiRagService) {
        return body -> {
            String query = body.get("query");
            String sessionId = body.getOrDefault("sessionId", "anonymous");
            Map<String, Object> result = new HashMap<>();
            try {
                String answer = aiRagService.generateResponseSync(sessionId, query);
                result.put("success", true);
                result.put("answer", answer);
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", e.getMessage());
            }
            return result;
        };
    }
}
