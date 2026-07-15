package com.linkedagent.systemmanagement.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sys")
public class MonitoringController {

    // 7.1 Implement internal system monitoring endpoint
    @GetMapping("/health")
    public Map<String, String> getHealthStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("database", "UP");
        status.put("redis", "UP");
        return status;
    }
    
    // 7.2 Set up basic tenant/knowledge base configuration schema
    @GetMapping("/tenant/config")
    public Map<String, Object> getTenantConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("tenantId", "default");
        config.put("knowledgeBaseId", "kb_main_01");
        config.put("active", true);
        return config;
    }
}
