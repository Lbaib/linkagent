package com.linkedagent.systemmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.linkedagent")
public class SystemManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(SystemManagementApplication.class, args);
    }
}
