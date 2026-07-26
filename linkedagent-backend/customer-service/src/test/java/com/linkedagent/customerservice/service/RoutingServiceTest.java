package com.linkedagent.customerservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RoutingServiceTest {

    private RoutingService routingService;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOps;
    private ZSetOperations<String, String> zSetOps;
    private SetOperations<String, String> setOps;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        routingService = new RoutingService();
        redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        zSetOps = mock(ZSetOperations.class);
        setOps = mock(SetOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(redisTemplate.opsForSet()).thenReturn(setOps);
        ReflectionTestUtils.setField(routingService, "redisTemplate", redisTemplate);
    }

    private void agentsAvailable(String agentId, double score) {
        ZSetOperations.TypedTuple<String> tuple = mock(ZSetOperations.TypedTuple.class);
        when(tuple.getValue()).thenReturn(agentId);
        when(tuple.getScore()).thenReturn(score);
        Set<ZSetOperations.TypedTuple<String>> agents = new LinkedHashSet<>();
        agents.add(tuple);
        when(zSetOps.rangeWithScores("agents:active", 0, 0)).thenReturn(agents);
    }

    @Test
    void assignsLeastLoadedOnlineAgent() {
        agentsAvailable("agent_1", 0d);

        Optional<String> assigned = routingService.assignAgent("visitor_abc");

        assertTrue(assigned.isPresent());
        assertEquals("agent_1", assigned.get());
        verify(valueOps).set("session:state:visitor_abc", "AGENT:agent_1");
        verify(valueOps).set("session:bind:visitor_abc", "agent_1");
        verify(setOps).add("agent:sessions:agent_1", "visitor_abc");
        verify(zSetOps).incrementScore("agents:active", "agent_1", 1);
    }

    @Test
    void returnsEmptyWhenNoAgentOnline() {
        when(zSetOps.rangeWithScores("agents:active", 0, 0)).thenReturn(Collections.emptySet());

        assertFalse(routingService.assignAgent("visitor_abc").isPresent());
    }

    @Test
    void returnsEmptyWhenAgentAtCapacity() {
        agentsAvailable("agent_1", (double) RoutingService.MAX_CONCURRENT_SESSIONS);

        assertFalse(routingService.assignAgent("visitor_abc").isPresent());
    }

    @Test
    void registerAgentAddsToOnlineSet() {
        routingService.registerAgent("agent_1");

        verify(zSetOps).addIfAbsent("agents:active", "agent_1", 0d);
    }

    @Test
    void unregisterAgentReleasesItsVisitors() {
        when(setOps.members("agent:sessions:agent_1"))
                .thenReturn(new LinkedHashSet<>(Set.of("visitor_abc")));

        Set<String> released = routingService.unregisterAgent("agent_1");

        assertEquals(Set.of("visitor_abc"), released);
        verify(redisTemplate).delete("session:bind:visitor_abc");
        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
        verify(redisTemplate).delete("agent:sessions:agent_1");
        verify(zSetOps).remove("agents:active", "agent_1");
    }

    @Test
    void getBoundAgentReadsBinding() {
        when(valueOps.get("session:bind:visitor_abc")).thenReturn("agent_1");

        assertEquals(Optional.of("agent_1"), routingService.getBoundAgent("visitor_abc"));
    }

    @Test
    void markQueueingWritesState() {
        routingService.markQueueing("visitor_abc");

        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
    }

    @Test
    void releaseVisitorUnbindsAndReturnsToQueue() {
        when(valueOps.get("session:bind:visitor_abc")).thenReturn("agent_1");

        routingService.releaseVisitor("visitor_abc");

        verify(setOps).remove("agent:sessions:agent_1", "visitor_abc");
        verify(zSetOps).incrementScore("agents:active", "agent_1", -1);
        verify(redisTemplate).delete("session:bind:visitor_abc");
        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
    }

    @Test
    void releaseVisitorWithNoBindingStillSetsQueueing() {
        when(valueOps.get("session:bind:visitor_abc")).thenReturn(null);

        routingService.releaseVisitor("visitor_abc");

        verifyNoInteractions(setOps);
        verifyNoInteractions(zSetOps);
        verify(redisTemplate).delete("session:bind:visitor_abc");
        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
    }
}
