package com.linkedagent.customerservice.service;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import com.linkedagent.customerservice.entity.SysUser;
import com.linkedagent.customerservice.repository.SysUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private SysUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Map<String, Object> login(String username, String rawPassword) {
        Map<String, Object> response = new HashMap<>();

        Optional<SysUser> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            response.put("code", 401);
            response.put("message", "User not found");
            return response;
        }

        SysUser user = userOpt.get();
        if (!user.getActive()) {
            response.put("code", 403);
            response.put("message", "Account is disabled");
            return response;
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            response.put("code", 401);
            response.put("message", "Invalid password");
            return response;
        }

        // Generate token
        String token = JwtUtils.generateToken(user.getUsername(), JwtRoles.AGENT);
        
        Map<String, String> data = new HashMap<>();
        data.put("token", token);
        data.put("username", user.getUsername());
        data.put("role", user.getRole());

        response.put("code", 200);
        response.put("message", "success");
        response.put("data", data);
        return response;
    }

    public Map<String, Object> getUserInfo(String username) {
        Map<String, Object> response = new HashMap<>();
        Optional<SysUser> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            SysUser user = userOpt.get();
            Map<String, Object> data = new HashMap<>();
            data.put("id", user.getId());
            data.put("username", user.getUsername());
            data.put("roles", new String[]{user.getRole()});
            
            response.put("code", 200);
            response.put("message", "success");
            response.put("data", data);
        } else {
            response.put("code", 404);
            response.put("message", "User not found");
        }
        return response;
    }
}
