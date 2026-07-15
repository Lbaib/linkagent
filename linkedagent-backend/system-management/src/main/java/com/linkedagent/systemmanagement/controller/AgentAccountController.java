package com.linkedagent.systemmanagement.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sys/agent")
public class AgentAccountController {

    // 7.1 Create agent account CRUD APIs
    @PostMapping("/create")
    public String createAgent() {
        return "Agent account created.";
    }
    
    @GetMapping("/list")
    public String listAgents() {
        return "List of agents.";
    }
}
