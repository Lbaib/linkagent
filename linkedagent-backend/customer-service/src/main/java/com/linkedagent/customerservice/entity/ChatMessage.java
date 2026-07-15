package com.linkedagent.customerservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String visitorId;
    private String sender;
    private String content;

    private LocalDateTime createdAt;

    public ChatMessage() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatMessage(String visitorId, String sender, String content) {
        this.visitorId = visitorId;
        this.sender = sender;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters omitted for brevity in skeleton
}
