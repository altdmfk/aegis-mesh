package com.aegis.gateway.policy;

import com.aegis.gateway.model.CompositePolicyKey;
import com.github.benmanes.caffeine.cache.Cache;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class PolicyEngine {

    private final Cache<String, PolicyDecision> l1PolicyCache;
    private final L2CacheService l2CacheService;
    private final MeterRegistry meterRegistry;
    private final ConcurrentMap<String, Mono<PolicyDecision>> inFlight = new ConcurrentHashMap<>();

    public Mono<PolicyDecision> evaluate(CompositePolicyKey key) {
        String hashedKey = key.toHashedKey();
        String rawKey = key.toString();
        
        return Mono.fromCallable(() -> {
                    PolicyDecision decision = l1PolicyCache.getIfPresent(hashedKey);
                    if (decision != null) {
                        meterRegistry.counter("aegis.policy.cache.l1.hits").increment();
                    }
                    return decision;
                })
                .switchIfEmpty(Mono.defer(() -> {
                    meterRegistry.counter("aegis.policy.cache.l1.misses").increment();
                    boolean[] deduplicated = { true };
                    Mono<PolicyDecision> result = inFlight.computeIfAbsent(hashedKey, k -> {
                        deduplicated[0] = false;
                        return l2CacheService.getPolicyDecision(rawKey)
                            .doOnNext(decision -> l1PolicyCache.put(hashedKey, decision))
                            .transformDeferred(mono -> Mono.defer(() -> {
                                Timer.Sample sample = Timer.start(meterRegistry);
                                return mono.doFinally(signal -> sample.stop(meterRegistry.timer("aegis.policy.cache.l2.latency")));
                            }))
                            .doFinally(signal -> inFlight.remove(hashedKey))
                            .cache(); // Coalesce concurrent subscribers
                    });
                    
                    if (deduplicated[0]) {
                        meterRegistry.counter("aegis.policy.singleflight.deduplicated").increment();
                    }
                    return result;
                }));
    }
}
