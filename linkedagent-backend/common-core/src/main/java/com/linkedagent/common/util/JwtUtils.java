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

    private static final String ENV_SECRET = "LINKEDAGENT_JWT_SECRET";
    private static final String PROP_SECRET = "linkedagent.jwt.secret";
    private static final int MIN_SECRET_UTF8_BYTES = 32;
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    private static volatile Key cachedKey;

    public static String generateToken(String subject, String role) {
        return Jwts.builder()
                .setSubject(subject)
                .claim(CLAIM_ROLE, role)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public static String getRole(String token) {
        return parseToken(token).get(CLAIM_ROLE, String.class);
    }

    /** Clears the lazily cached signing key. For tests only. */
    public static void clearCachedSecret() {
        cachedKey = null;
    }

    private static Key signingKey() {
        Key key = cachedKey;
        if (key == null) {
            synchronized (JwtUtils.class) {
                key = cachedKey;
                if (key == null) {
                    key = Keys.hmacShaKeyFor(resolveSecret().getBytes(StandardCharsets.UTF_8));
                    cachedKey = key;
                }
            }
        }
        return key;
    }

    private static String resolveSecret() {
        String secret = System.getenv(ENV_SECRET);
        if (secret == null || secret.isBlank()) {
            secret = System.getProperty(PROP_SECRET);
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT signing secret is not configured. Set environment variable "
                            + ENV_SECRET + " (or system property " + PROP_SECRET + ").");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_UTF8_BYTES) {
            throw new IllegalStateException(
                    "JWT signing secret must be at least " + MIN_SECRET_UTF8_BYTES
                            + " UTF-8 bytes. Set " + ENV_SECRET + ".");
        }
        return secret;
    }
}
