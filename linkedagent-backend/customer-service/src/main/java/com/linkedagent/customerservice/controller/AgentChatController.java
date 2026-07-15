package com.linkedagent.customerservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/agent/chat")
public class AgentChatController {

    // 6.1 Implement API to fetch conversation context (AI chat history) for the agent
    @GetMapping("/history/{visitorId}")
    public List<String> getChatHistory(@PathVariable String visitorId) {
        // Fetch from Postgres DB via JPA
        return Collections.singletonList("Simulated chat history for " + visitorId);
    }
}
