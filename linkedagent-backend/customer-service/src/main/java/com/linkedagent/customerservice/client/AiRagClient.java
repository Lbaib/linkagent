package com.linkedagent.customerservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ai-rag-service")
public interface AiRagClient {

    @PostMapping("/api/ai/ask")
    String askQuestion(@RequestParam("sessionId") String sessionId, @RequestBody String query);
}
