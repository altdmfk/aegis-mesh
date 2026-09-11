package com.aegis.gateway.policy;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class L2CacheService {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final java.util.Set<String> policyAllowlist;

    public L2CacheService(
            @Qualifier("reactiveRedisTemplate") ReactiveRedisTemplate<String, String> redisTemplate,
            @org.springframework.beans.factory.annotation.Value("${gateway.security.policy-allowlist:}") String allowlistRaw) {
        this.redisTemplate = redisTemplate;
        this.policyAllowlist = java.util.Arrays.stream(allowlistRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public Mono<PolicyDecision> getPolicyDecision(String rawKeyStr) {
        return redisTemplate.opsForValue().get("policy:" + rawKeyStr)
                .map(PolicyDecision::valueOf)
                .switchIfEmpty(Mono.defer(() -> {
                    if (policyAllowlist.contains(rawKeyStr)) {
                        return Mono.just(PolicyDecision.ALLOW);
                    }
                    return Mono.just(PolicyDecision.DENY);
                }));
    }

    public Mono<Boolean> setPolicyDecision(String rawKeyStr, PolicyDecision decision) {
        String hashedKey = sha256Hex(rawKeyStr);
        return redisTemplate.opsForValue().set("policy:" + rawKeyStr, decision.name(), Duration.ofHours(1))
                .flatMap(success -> redisTemplate.convertAndSend("policy-invalidation", hashedKey).thenReturn(success));
    }

    private static String sha256Hex(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) sb.append('0');
                sb.append(h);
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }
}
