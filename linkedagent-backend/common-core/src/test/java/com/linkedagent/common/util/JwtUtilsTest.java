package com.linkedagent.common.util;

import com.linkedagent.common.constant.JwtRoles;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilsTest {

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
}
