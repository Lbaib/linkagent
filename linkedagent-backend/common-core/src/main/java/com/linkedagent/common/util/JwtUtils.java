package com.linkedagent.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

public class JwtUtils {

    public static final String CLAIM_ROLE = "role";

    // Static shared secret for cross-JVM validation
    private static final String SECRET_STRING = "linkedagent_default_secret_string_min_32_bytes_long";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    public static String generateToken(String subject, String role) {
        return Jwts.builder()
                .setSubject(subject)
                .claim(CLAIM_ROLE, role)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public static String getRole(String token) {
        return parseToken(token).get(CLAIM_ROLE, String.class);
    }
}
