package com.linkedagent.customerservice.controller;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthControllerTest {

    private static final String TEST_SECRET = "test-only-linkedagent-jwt-secret-32b!";
    private static final String PROPERTY = "linkedagent.jwt.secret";

    @BeforeEach
    void setUpSecret() {
        JwtUtils.clearCachedSecret();
        System.setProperty(PROPERTY, TEST_SECRET);
    }

    @AfterEach
    void tearDownSecret() {
        System.clearProperty(PROPERTY);
        JwtUtils.clearCachedSecret();
    }

    @Test
    @SuppressWarnings("unchecked")
    void anonymousTokenCarriesVisitorRole() {
        Map<String, Object> response = new AuthController().getAnonymousToken();

        assertEquals(200, response.get("code"));
        Map<String, String> data = (Map<String, String>) response.get("data");
        assertTrue(data.get("visitorId").startsWith("visitor_"));
        assertEquals(data.get("visitorId"), JwtUtils.parseToken(data.get("token")).getSubject());
        assertEquals(JwtRoles.VISITOR, JwtUtils.getRole(data.get("token")));
    }
}
