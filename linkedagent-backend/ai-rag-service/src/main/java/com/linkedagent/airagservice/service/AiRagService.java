package com.linkedagent.airagservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.linkedagent.airagservice.repository.DocumentChunkRepository;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
public class AiRagService {

    @Autowired
    private StringRedisTemplate redisTemplate;
    
    @Autowired
    private EmbeddingService embeddingService;
    
    @Autowired
    private DocumentChunkRepository documentChunkRepository;
    
    private final String API_URL = "https://yundu.lat/v1/chat/completions";
    private final String API_KEY = "sk-c93d2942533f4a3122e99c2c736e6b231b7e123d3b027c5fffab0c5362046f82";

    public String generateResponseSync(String sessionId, String query) {
        try {
            List<Double> embedding = embeddingService.getEmbedding(query);
            String vectorStr = "[" + embedding.stream().map(String::valueOf).collect(Collectors.joining(",")) + "]";
            
            List<String> similarChunks = documentChunkRepository.findTop3Similar(vectorStr);
            String augmentedQuery = query;
            if (similarChunks != null && !similarChunks.isEmpty()) {
                String context = String.join("\n\n", similarChunks);
                augmentedQuery = "Background context:\n" + context + "\n\nUser Question:\n" + query;
            }

            RestTemplate restTemplate = new RestTemplate();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + API_KEY);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-5.5");
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", augmentedQuery);
            messages.add(userMessage);
            
            body.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return "AI returned an empty or invalid response.";
        } catch (Exception e) {
            e.printStackTrace();
            return "AI Error: " + e.getMessage();
        }
    }

    public String generateResponse(String sessionId, String query) {
        new Thread(() -> {
            try {
                String response = "This is a streamed AI response for query: " + query;
                for (String word : response.split(" ")) {
                    String payload = String.format("{\"type\":\"stream\",\"to\":\"%s\",\"content\":\"%s \"}", sessionId, word);
                    redisTemplate.convertAndSend("chat:routing:topic", payload);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();

        return "Started streaming";
    }
}
