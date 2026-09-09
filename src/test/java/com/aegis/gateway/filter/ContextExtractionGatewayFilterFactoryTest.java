package com.aegis.gateway.filter;

import com.aegis.gateway.BaseBlockHoundTest;
import com.aegis.gateway.model.SecurityContextExchange;
import com.aegis.gateway.model.SpiffeIdentity;
import com.aegis.gateway.model.UserTokenIdentity;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.PlainJWT;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.SslInfo;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.security.cert.X509Certificate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

class ContextExtractionGatewayFilterFactoryTest extends BaseBlockHoundTest {

    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    private final ContextExtractionGatewayFilterFactory factory = new ContextExtractionGatewayFilterFactory(meterRegistry);
    private final GatewayFilter filter = factory.apply(new ContextExtractionGatewayFilterFactory.Config());

    private SslInfo mockSslInfo(String spiffeUri) throws Exception {
        X509Certificate cert = mock(X509Certificate.class);
        if (spiffeUri != null) {
            when(cert.getSubjectAlternativeNames()).thenReturn(List.of(List.of(6, spiffeUri)));
        }
        SslInfo sslInfo = mock(SslInfo.class);
        when(sslInfo.getPeerCertificates()).thenReturn(new X509Certificate[]{cert});
        return sslInfo;
    }

    @Test
    void testMissingSslSession_ReturnsUnauthorized() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result)
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        assertTrue(exchange.getResponse().getHeaders().containsKey("Content-Type"));
    }

    @Test
    void testMissingUserToken_ReturnsUnauthorized() throws Exception {
        SslInfo sslInfo = mockSslInfo("spiffe://cluster.local/ns/default/sa/service-a");
        var builder = MockServerHttpRequest.get("/api");
        builder.sslInfo(sslInfo);
        MockServerHttpRequest request = builder.build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result)
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testMalformedUserToken_ReturnsUnauthorized() throws Exception {
        SslInfo sslInfo = mockSslInfo("spiffe://cluster.local/ns/default/sa/service-a");
        var builder = MockServerHttpRequest.get("/api");
        builder.sslInfo(sslInfo);
        MockServerHttpRequest request = builder
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.jwt.token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        GatewayFilterChain chain = mock(GatewayFilterChain.class);

        Mono<Void> result = filter.filter(exchange, chain);

        StepVerifier.create(result)
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testValidContextExtraction_Success() throws Exception {
        SslInfo sslInfo = mockSslInfo("spiffe://cluster.local/ns/default/sa/service-a");
        PlainJWT plainJWT = new PlainJWT(new JWTClaimsSet.Builder().subject("user123").build());
        String validToken = plainJWT.serialize();

        var builder = MockServerHttpRequest.get("/api");
        builder.sslInfo(sslInfo);
        MockServerHttpRequest request = builder
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validToken)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        GatewayFilterChain chain = ex -> {
            SecurityContextExchange context = ex.getAttribute(ContextExtractionGatewayFilterFactory.CONTEXT_KEY);
            assertNotNull(context);
            assertEquals("/api", context.path());
            assertEquals("GET", context.method());
            assertEquals("user123", ((UserTokenIdentity) context.userIdentity()).subject());
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();
    }
}
