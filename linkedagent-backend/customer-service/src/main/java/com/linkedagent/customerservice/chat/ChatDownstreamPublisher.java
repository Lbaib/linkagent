package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.ChatChannels;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatDownstreamPublisher {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void send(String targetId, String frameJson) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("targetId", targetId);
        message.put("frame", frameJson);
        redisTemplate.convertAndSend(ChatChannels.DOWNSTREAM, message.toString());
    }
}
