package com.linkedagent.airagservice.controller;

import com.linkedagent.airagservice.service.AiRagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*") // Ensure frontend can call this
public class AiController {

    @Autowired
    private AiRagService aiRagService;

    @PostMapping("/ask")
    public Map<String, Object> askQuestion(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        String sessionId = payload.getOrDefault("sessionId", "anonymous");
        
        // Synchronous call to real AI
        String answer = aiRagService.generateResponseSync(sessionId, query);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("answer", answer);
        return result;
    }
}
