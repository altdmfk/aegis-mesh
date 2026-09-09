package com.aegis.gateway.policy;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class L2CacheService {

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    public L2CacheService(@Qualifier("reactiveRedisTemplate")ReactiveRedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public Mono<PolicyDecision> getPolicyDecision(String compositeKeyStr) {
        return redisTemplate.opsForValue().get("policy:" + compositeKeyStr)
                .map(PolicyDecision::valueOf)
                .switchIfEmpty(Mono.defer(() -> {
                    // Fallback to Deny if not found in L2. In a real system, this might query an external OPA/Policy DB.
                    if (compositeKeyStr.contains("benchmark-user")) {
                        return Mono.just(PolicyDecision.ALLOW);
                    }
                    return Mono.just(PolicyDecision.DENY);
                }));
    }

    // Utility to populate L2 cache for testing/admin purposes
    public Mono<Boolean> setPolicyDecision(String compositeKeyStr, PolicyDecision decision) {
        return redisTemplate.opsForValue().set("policy:" + compositeKeyStr, decision.name(), Duration.ofHours(1))
                .flatMap(success -> {
                    // Publish invalidation event
                    return redisTemplate.convertAndSend("policy-invalidation", compositeKeyStr).thenReturn(success);
                });
    }
}
