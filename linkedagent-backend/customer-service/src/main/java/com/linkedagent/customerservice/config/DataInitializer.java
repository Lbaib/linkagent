package com.linkedagent.customerservice.config;

import com.linkedagent.customerservice.entity.SysUser;
import com.linkedagent.customerservice.repository.SysUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SysUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            SysUser admin = new SysUser();
            admin.setUsername("test_admin");
            // encode password "123456"
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setRole("ROLE_ADMIN");
            admin.setActive(true);
            userRepository.save(admin);
            
            System.out.println("==========================================================");
            System.out.println("Default admin user created: test_admin / 123456");
            System.out.println("==========================================================");
        }
    }
}
