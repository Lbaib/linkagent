package com.linkedagent.common.constant;

public final class WsFrames {

    public static final String CHAT = "CHAT";
    public static final String TRANSFER_AGENT = "TRANSFER_AGENT";
    public static final String AGENT_READY = "AGENT_READY";
    public static final String AI_STREAM = "AI_STREAM";
    public static final String STATUS_UPDATE = "STATUS_UPDATE";
    public static final String SESSION_OFFER = "SESSION_OFFER";
    public static final String ERROR = "ERROR";

    /** Internal upstream-only frame emitted by chat-server when a connection closes. */
    public static final String DISCONNECT = "DISCONNECT";

    private WsFrames() {
    }
}
