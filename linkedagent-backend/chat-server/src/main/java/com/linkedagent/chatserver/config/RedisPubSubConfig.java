package com.linkedagent.chatserver.config;

import com.linkedagent.chatserver.websocket.ChatWebSocketHandler;
import com.linkedagent.common.constant.ChatChannels;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {

    @Bean
    public RedisMessageListenerContainer chatDownstreamContainer(RedisConnectionFactory connectionFactory,
                                                                 MessageListenerAdapter chatDownstreamListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(chatDownstreamListenerAdapter, new ChannelTopic(ChatChannels.DOWNSTREAM));
        return container;
    }

    @Bean
    public MessageListenerAdapter chatDownstreamListenerAdapter(ChatWebSocketHandler handler) {
        return new MessageListenerAdapter(handler, "handleRedisMessage");
    }
}
