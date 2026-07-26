package com.linkedagent.customerservice.controller;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private com.linkedagent.customerservice.service.AuthService authService;

    @GetMapping("/anonymous")
    public Map<String, Object> getAnonymousToken() {
        String visitorId = "visitor_" + UUID.randomUUID().toString();
        String token = JwtUtils.generateToken(visitorId, JwtRoles.VISITOR);
        
        Map<String, String> data = new HashMap<>();
        data.put("token", token);
        data.put("visitorId", visitorId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", data);
        
        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        if (username == null || password == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("message", "Username and password required");
            return response;
        }

        return authService.login(username, password);
    }

    @GetMapping("/user-info")
    public Map<String, Object> getUserInfo(@org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String authHeader) {
        // In a real scenario, interceptors/filters usually parse the token and put it in context.
        // For simplicity, we just extract from header here, assuming format "Bearer token"
        String username = "test_admin"; // Default fallback if no token
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                username = JwtUtils.parseToken(token).getSubject();
            } catch (Exception e) {
                // Keep default if parsing fails
            }
        }
        
        return authService.getUserInfo(username);
    }
}
