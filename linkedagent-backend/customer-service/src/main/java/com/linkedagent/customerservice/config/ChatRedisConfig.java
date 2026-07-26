package com.linkedagent.customerservice.config;

import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.customerservice.chat.ChatUpstreamListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class ChatRedisConfig {

    @Bean
    public MessageListenerAdapter chatUpstreamListenerAdapter(ChatUpstreamListener listener) {
        return new MessageListenerAdapter(listener, "handleUpstreamMessage");
    }

    @Bean
    public RedisMessageListenerContainer chatUpstreamContainer(RedisConnectionFactory connectionFactory,
                                                               MessageListenerAdapter chatUpstreamListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(chatUpstreamListenerAdapter, new ChannelTopic(ChatChannels.UPSTREAM));
        return container;
    }
}
