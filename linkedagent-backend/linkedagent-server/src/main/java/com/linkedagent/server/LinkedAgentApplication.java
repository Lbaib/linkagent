package com.linkedagent.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.linkedagent")
@EntityScan(basePackages = "com.linkedagent")
@EnableJpaRepositories(basePackages = "com.linkedagent")
@EnableScheduling
public class LinkedAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(LinkedAgentApplication.class, args);
    }
}
