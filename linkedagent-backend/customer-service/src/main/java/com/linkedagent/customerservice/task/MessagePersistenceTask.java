package com.linkedagent.customerservice.task;

import com.linkedagent.customerservice.entity.ChatMessage;
import com.linkedagent.customerservice.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@EnableScheduling
public class MessagePersistenceTask {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    // Async task to save buffered messages to PostgreSQL
    @Scheduled(fixedDelay = 5000)
    public void persistMessages() {
        // Pop up to 100 messages at once to avoid inefficient polling
        List<String> messages = redisTemplate.opsForList().range("chat:messages", 0, 99);
        if (messages != null && !messages.isEmpty()) {
            List<ChatMessage> entities = new ArrayList<>();
            for (String message : messages) {
                // message format expected: visitorId:content
                String[] parts = message.split(":", 2);
                if (parts.length == 2) {
                    entities.add(new ChatMessage(parts[0], "unknown", parts[1]));
                }
            }
            chatMessageRepository.saveAll(entities);
            // Trim the processed messages
            redisTemplate.opsForList().trim("chat:messages", messages.size(), -1);
            System.out.println("Persisted batch of " + messages.size() + " messages to DB.");
        }
    }
}
