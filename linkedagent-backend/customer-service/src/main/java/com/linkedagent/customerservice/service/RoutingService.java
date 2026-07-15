package com.linkedagent.customerservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;

@Service
public class RoutingService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    // 5.1 Create session state management
    public void transitionToQueueing(String visitorId) {
        redisTemplate.opsForValue().set("session:state:" + visitorId, "QUEUEING");
        addToQueue(visitorId);
    }

    // 5.2 Implement round-robin agent allocation logic
    // 5.3 Build queue management in Redis for customers waiting
    private void addToQueue(String visitorId) {
        // Find available agent using ZSET for atomic, ordered assignment
        Set<TypedTuple<String>> agents = redisTemplate.opsForZSet().rangeWithScores("agents:active", 0, 0);
        String assignedAgent = null;
        
        if (agents != null && !agents.isEmpty()) {
            TypedTuple<String> leastLoadedAgent = agents.iterator().next();
            if (leastLoadedAgent.getScore() != null && leastLoadedAgent.getScore() < 5) {
                assignedAgent = leastLoadedAgent.getValue();
                // Atomic increment
                redisTemplate.opsForZSet().incrementScore("agents:active", assignedAgent, 1);
            }
        }
        
        if (assignedAgent != null) {
            redisTemplate.opsForValue().set("session:state:" + visitorId, "AGENT:" + assignedAgent);
        } else {
            // Add to wait queue
            redisTemplate.opsForList().rightPush("queue:wait", visitorId);
            // In a real system, publish event to Chat-Server to notify the queue position
            redisTemplate.convertAndSend("queue:updates:topic", visitorId);
        }
    }

    // 5.4 Implement real-time queue position updates
    public Long getQueuePosition(String visitorId) {
        return redisTemplate.opsForList().indexOf("queue:wait", visitorId);
    }
}
