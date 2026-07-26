package com.linkedagent.customerservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class RoutingService {

    public static final int MAX_CONCURRENT_SESSIONS = 5;

    private static final String ONLINE_AGENTS_KEY = "agents:active";
    private static final String STATE_PREFIX = "session:state:";
    private static final String BIND_PREFIX = "session:bind:";
    private static final String AGENT_SESSIONS_PREFIX = "agent:sessions:";
    private static final String STATE_QUEUEING = "QUEUEING";

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void registerAgent(String agentId) {
        redisTemplate.opsForZSet().addIfAbsent(ONLINE_AGENTS_KEY, agentId, 0d);
    }

    /** Removes the agent and returns the visitors that were bound to it. */
    public Set<String> unregisterAgent(String agentId) {
        Set<String> visitors = redisTemplate.opsForSet().members(AGENT_SESSIONS_PREFIX + agentId);
        Set<String> released = visitors == null ? Collections.emptySet() : new LinkedHashSet<>(visitors);
        for (String visitorId : released) {
            redisTemplate.delete(BIND_PREFIX + visitorId);
            redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
        }
        redisTemplate.delete(AGENT_SESSIONS_PREFIX + agentId);
        redisTemplate.opsForZSet().remove(ONLINE_AGENTS_KEY, agentId);
        return released;
    }

    public Optional<String> assignAgent(String visitorId) {
        Set<TypedTuple<String>> agents = redisTemplate.opsForZSet().rangeWithScores(ONLINE_AGENTS_KEY, 0, 0);
        if (agents == null || agents.isEmpty()) {
            return Optional.empty();
        }
        TypedTuple<String> candidate = agents.iterator().next();
        String agentId = candidate.getValue();
        Double load = candidate.getScore();
        if (agentId == null || load == null || load >= MAX_CONCURRENT_SESSIONS) {
            return Optional.empty();
        }
        redisTemplate.opsForZSet().incrementScore(ONLINE_AGENTS_KEY, agentId, 1);
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, "AGENT:" + agentId);
        redisTemplate.opsForValue().set(BIND_PREFIX + visitorId, agentId);
        redisTemplate.opsForSet().add(AGENT_SESSIONS_PREFIX + agentId, visitorId);
        return Optional.of(agentId);
    }

    public void markQueueing(String visitorId) {
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
    }

    public Optional<String> getBoundAgent(String visitorId) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(BIND_PREFIX + visitorId));
    }

    /** Unbinds a visitor from its agent and puts the session back into the queue. */
    public void releaseVisitor(String visitorId) {
        Optional<String> agentId = getBoundAgent(visitorId);
        agentId.ifPresent(id -> {
            redisTemplate.opsForSet().remove(AGENT_SESSIONS_PREFIX + id, visitorId);
            redisTemplate.opsForZSet().incrementScore(ONLINE_AGENTS_KEY, id, -1);
        });
        redisTemplate.delete(BIND_PREFIX + visitorId);
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
    }
}
