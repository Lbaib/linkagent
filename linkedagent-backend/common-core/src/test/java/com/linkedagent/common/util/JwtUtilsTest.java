package com.linkedagent.common.util;

import com.linkedagent.common.constant.JwtRoles;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilsTest {

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
    void generateTokenCarriesSubjectAndRole() {
        String token = JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR);

        assertEquals("visitor_abc", JwtUtils.parseToken(token).getSubject());
        assertEquals(JwtRoles.VISITOR, JwtUtils.getRole(token));
    }

    @Test
    void agentTokenCarriesAgentRole() {
        String token = JwtUtils.generateToken("test_admin", JwtRoles.AGENT);

        assertEquals(JwtRoles.AGENT, JwtUtils.getRole(token));
    }

    @Test
    void invalidTokenIsRejected() {
        assertThrows(RuntimeException.class, () -> JwtUtils.parseToken("not-a-jwt"));
    }

    @Test
    void missingSecretFailsClosed() {
        System.clearProperty(PROPERTY);
        JwtUtils.clearCachedSecret();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR));
        assertTrue(ex.getMessage().contains("LINKEDAGENT_JWT_SECRET"));
    }

    @Test
    void shortSecretIsRejected() {
        System.setProperty(PROPERTY, "too-short");
        JwtUtils.clearCachedSecret();

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR));
        assertTrue(ex.getMessage().toLowerCase().contains("32"));
    }
}
