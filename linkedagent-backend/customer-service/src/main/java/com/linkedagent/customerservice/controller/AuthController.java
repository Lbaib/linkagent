package com.linkedagent.customerservice.controller;

import com.linkedagent.common.util.JwtUtils;
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

    @GetMapping("/anonymous")
    public Map<String, Object> getAnonymousToken() {
        String visitorId = "visitor_" + UUID.randomUUID().toString();
        String token = JwtUtils.generateToken(visitorId);
        
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
        String token = JwtUtils.generateToken(username != null ? username : "test_admin");
        
        Map<String, String> data = new HashMap<>();
        data.put("token", token);
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", data);
        return response;
    }

    @GetMapping("/user-info")
    public Map<String, Object> getUserInfo() {
        Map<String, Object> data = new HashMap<>();
        data.put("id", 1);
        data.put("username", "test_admin");
        data.put("roles", new String[]{"ROLE_ADMIN"});
        
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", data);
        return response;
    }
}
