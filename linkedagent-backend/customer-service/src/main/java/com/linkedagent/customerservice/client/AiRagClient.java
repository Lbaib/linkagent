package com.linkedagent.customerservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "ai-rag-service")
public interface AiRagClient {

    @PostMapping(value = "/api/ai/ask", consumes = MediaType.APPLICATION_JSON_VALUE)
    Map<String, Object> ask(@RequestBody Map<String, String> body);
}
