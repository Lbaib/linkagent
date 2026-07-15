package com.linkedagent.airagservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    @Value("${openai.api.base-url:https://yundu.lat}")
    private String baseUrl;

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public List<Double> getEmbedding(String text) {
        String url = baseUrl + "/v1/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("input", text);
        requestBody.put("model", "text-embedding-3-small");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        
        Map<String, Object> body = response.getBody();
        if (body != null && body.containsKey("data")) {
            List<Map<String, Object>> data = (List<Map<String, Object>>) body.get("data");
            if (data != null && !data.isEmpty()) {
                return (List<Double>) data.get(0).get("embedding");
            }
        }
        throw new RuntimeException("Failed to get embedding from OpenAI");
    }
}
