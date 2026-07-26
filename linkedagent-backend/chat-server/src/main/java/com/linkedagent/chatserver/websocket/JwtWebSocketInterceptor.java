package com.linkedagent.chatserver.websocket;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import io.jsonwebtoken.Claims;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class JwtWebSocketInterceptor implements HandshakeInterceptor {

    public static final String ATTR_CONNECTION_ID = "connectionId";
    public static final String ATTR_ROLE = "role";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest)) {
            return false;
        }
        String token = ((ServletServerHttpRequest) request).getServletRequest().getParameter("token");
        if (token == null || token.isEmpty()) {
            return false;
        }
        try {
            Claims claims = JwtUtils.parseToken(token);
            String role = claims.get(JwtUtils.CLAIM_ROLE, String.class);
            if (role == null) {
                role = JwtRoles.VISITOR;
            }
            attributes.put(ATTR_CONNECTION_ID, claims.getSubject());
            attributes.put(ATTR_ROLE, role);
            return true;
        } catch (Exception e) {
            // Never log the raw token: it is a credential.
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
