package com.linkedagent.chatserver.websocket;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtWebSocketInterceptorTest {

    private final JwtWebSocketInterceptor interceptor = new JwtWebSocketInterceptor();

    private boolean handshake(String token, Map<String, Object> attributes) throws Exception {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        if (token != null) {
            servletRequest.setParameter("token", token);
        }
        return interceptor.beforeHandshake(
                new ServletServerHttpRequest(servletRequest),
                new ServletServerHttpResponse(new MockHttpServletResponse()),
                null,
                attributes);
    }

    @Test
    void visitorTokenPopulatesConnectionIdAndRole() throws Exception {
        Map<String, Object> attributes = new HashMap<>();
        String token = JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR);

        assertTrue(handshake(token, attributes));
        assertEquals("visitor_abc", attributes.get("connectionId"));
        assertEquals(JwtRoles.VISITOR, attributes.get("role"));
    }

    @Test
    void agentTokenPopulatesAgentRole() throws Exception {
        Map<String, Object> attributes = new HashMap<>();
        String token = JwtUtils.generateToken("test_admin", JwtRoles.AGENT);

        assertTrue(handshake(token, attributes));
        assertEquals(JwtRoles.AGENT, attributes.get("role"));
    }

    @Test
    void missingTokenIsRejected() throws Exception {
        assertFalse(handshake(null, new HashMap<>()));
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        assertFalse(handshake("not-a-jwt", new HashMap<>()));
    }
}
