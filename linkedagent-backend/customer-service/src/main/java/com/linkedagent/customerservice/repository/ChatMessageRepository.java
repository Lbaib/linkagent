package com.linkedagent.customerservice.repository;

import com.linkedagent.customerservice.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByVisitorIdOrderByCreatedAtAsc(String visitorId);
}
