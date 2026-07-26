package com.linkedagent.airagservice.service;

import com.linkedagent.airagservice.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRagServiceTest {

    private AiRagService aiRagService;

    @BeforeEach
    void setUp() {
        aiRagService = new AiRagService();
        ReflectionTestUtils.setField(aiRagService, "baseUrl", "https://example.invalid");
        ReflectionTestUtils.setField(aiRagService, "chatModel", "gpt-5.5");
    }

    @Test
    void blankKeyFailsFast() {
        ReflectionTestUtils.setField(aiRagService, "apiKey", "  ");

        AiServiceException error = assertThrows(AiServiceException.class,
                () -> aiRagService.generateResponseSync("visitor_abc", "退货政策?"));
        assertTrue(error.getMessage().contains("OPENAI_API_KEY"));
    }

    @Test
    void placeholderKeyFailsFast() {
        ReflectionTestUtils.setField(aiRagService, "apiKey", "sk-dummy-key");

        assertThrows(AiServiceException.class,
                () -> aiRagService.generateResponseSync("visitor_abc", "退货政策?"));
    }
}
