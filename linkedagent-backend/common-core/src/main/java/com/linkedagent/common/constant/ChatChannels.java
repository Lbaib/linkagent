package com.linkedagent.common.constant;

public final class ChatChannels {

    /** chat-server -> customer-service */
    public static final String UPSTREAM = "chat:upstream";

    /** customer-service -> chat-server */
    public static final String DOWNSTREAM = "chat:downstream";

    private ChatChannels() {
    }
}
