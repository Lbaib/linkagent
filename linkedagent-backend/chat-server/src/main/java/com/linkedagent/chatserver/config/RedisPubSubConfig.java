package com.linkedagent.chatserver.config;

import com.linkedagent.chatserver.websocket.ChatWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {

    public static final String CHAT_TOPIC = "chat:routing:topic";

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                                   MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new ChannelTopic(CHAT_TOPIC));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(ChatWebSocketHandler handler) {
        // We will add a method handleRedisMessage(String) in ChatWebSocketHandler
        return new MessageListenerAdapter(handler, "handleRedisMessage");
    }
}
