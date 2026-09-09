package com.aegis.gateway.policy;

import com.github.benmanes.caffeine.cache.Cache;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.ReactiveSubscription;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PolicyInvalidationListener {

    private final ReactiveRedisMessageListenerContainer listenerContainer;
    private final Cache<String, PolicyDecision> l1PolicyCache;

    @PostConstruct
    public void init() {
        listenerContainer.receive(ChannelTopic.of("policy-invalidation"))
                .map(ReactiveSubscription.Message::getMessage)
                .doOnNext(message -> {
                    if (message != null) {
                        if (message.endsWith("*")) {
                            String prefix = message.substring(0, message.length() - 1);
                            l1PolicyCache.asMap().keySet().removeIf(key -> key.startsWith(prefix));
                        } else {
                            l1PolicyCache.invalidate(message);
                        }
                    }
                })
                .subscribe(); // Non-blocking subscription on EventLoop
    }
}
