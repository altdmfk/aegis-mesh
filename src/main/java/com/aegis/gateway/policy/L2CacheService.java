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
                    boolean allowed = policyAllowlist.stream().anyMatch(pattern -> 
                        new org.springframework.util.AntPathMatcher().match(pattern, rawKeyStr)
                    );
                    if (allowed) {
                        return Mono.just(PolicyDecision.ALLOW);
                    }
                    return Mono.just(PolicyDecision.DENY);
                }));
    }

    public Mono<Boolean> setPolicyDecision(String rawKeyStr, PolicyDecision decision) {
        String hashedKey = com.aegis.gateway.util.HashUtil.sha256Hex(rawKeyStr);
        return redisTemplate.opsForValue().set("policy:" + rawKeyStr, decision.name(), Duration.ofHours(1))
                .flatMap(success -> redisTemplate.convertAndSend("policy-invalidation", hashedKey).thenReturn(success));
    }


}
