package com.linkedagent.customerservice.service;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import com.linkedagent.customerservice.entity.SysUser;
import com.linkedagent.customerservice.repository.SysUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private AuthService authService;
    private SysUserRepository userRepository;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        userRepository = mock(SysUserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "passwordEncoder", passwordEncoder);
    }

    @Test
    @SuppressWarnings("unchecked")
    void loginIssuesAgentRoleToken() {
        SysUser user = new SysUser();
        user.setUsername("test_admin");
        user.setPassword("encoded");
        user.setRole("ROLE_ADMIN");
        user.setActive(true);
        when(userRepository.findByUsername("test_admin")).thenReturn(Optional.of(user));

        Map<String, Object> response = authService.login("test_admin", "123456");

        assertEquals(200, response.get("code"));
        Map<String, String> data = (Map<String, String>) response.get("data");
        assertEquals("test_admin", JwtUtils.parseToken(data.get("token")).getSubject());
        assertEquals(JwtRoles.AGENT, JwtUtils.getRole(data.get("token")));
    }

    @Test
    void loginRejectsUnknownUser() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertEquals(401, authService.login("ghost", "123456").get("code"));
    }
}
