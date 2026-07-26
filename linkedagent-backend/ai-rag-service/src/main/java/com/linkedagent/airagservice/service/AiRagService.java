package com.linkedagent.airagservice.service;

import com.linkedagent.airagservice.exception.AiServiceException;
import com.linkedagent.airagservice.repository.DocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiRagService {

    private static final Logger log = LoggerFactory.getLogger(AiRagService.class);
    private static final String PLACEHOLDER_KEY = "sk-dummy-key";

    @Value("${openai.api.base-url:https://yundu.lat}")
    private String baseUrl;

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.chat-model:gpt-5.5}")
    private String chatModel;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public String generateResponseSync(String sessionId, String query) {
        requireApiKey();

        String augmentedQuery = augmentWithKnowledge(query);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", augmentedQuery);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(userMessage);

        Map<String, Object> body = new HashMap<>();
        body.put("model", chatModel);
        body.put("messages", messages);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/v1/chat/completions", new HttpEntity<>(body, headers), Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("choices")) {
                throw new AiServiceException("LLM returned an empty response for session " + sessionId);
            }
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices.isEmpty()) {
                throw new AiServiceException("LLM returned no choices for session " + sessionId);
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = message == null ? null : (String) message.get("content");
            if (content == null || content.isBlank()) {
                throw new AiServiceException("LLM returned blank content for session " + sessionId);
            }
            return content;
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("LLM call failed: " + e.getMessage(), e);
        }
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank() || PLACEHOLDER_KEY.equals(apiKey.trim())) {
            throw new AiServiceException("Model API key is not configured. Set OPENAI_API_KEY before serving traffic.");
        }
    }

    private String augmentWithKnowledge(String query) {
        try {
            List<Double> embedding = embeddingService.getEmbedding(query);
            String vectorStr = "[" + embedding.stream().map(String::valueOf).collect(Collectors.joining(",")) + "]";
            List<String> similarChunks = documentChunkRepository.findTop3Similar(vectorStr);
            if (similarChunks == null || similarChunks.isEmpty()) {
                return query;
            }
            return "Background context:\n" + String.join("\n\n", similarChunks) + "\n\nUser Question:\n" + query;
        } catch (Exception e) {
            log.warn("Vector retrieval unavailable, answering without knowledge context: {}", e.getMessage());
            return query;
        }
    }
}
