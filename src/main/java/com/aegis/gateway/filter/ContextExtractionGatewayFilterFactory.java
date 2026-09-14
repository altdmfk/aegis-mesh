package com.aegis.gateway.filter;

import com.aegis.gateway.model.SecurityContextExchange;
import com.aegis.gateway.model.SpiffeIdentity;
import com.aegis.gateway.model.UserTokenIdentity;
import com.aegis.gateway.util.ErrorResponseUtil;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import java.security.cert.X509Certificate;
import java.util.Collection;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ContextExtractionGatewayFilterFactory extends AbstractGatewayFilterFactory<ContextExtractionGatewayFilterFactory.Config> {

    public static final String CONTEXT_KEY = "security_context_exchange";
    private static final Pattern SPIFFE_PATTERN = Pattern.compile("^spiffe://[^/]+/ns/([^/]+)/sa/([^/]+)$");
    private final MeterRegistry meterRegistry;

    private final String secretKey;

    public ContextExtractionGatewayFilterFactory(MeterRegistry meterRegistry, @org.springframework.beans.factory.annotation.Value("${gateway.security.secret-key}") String secretKey) {
        super(Config.class);
        this.meterRegistry = meterRegistry;
        this.secretKey = secretKey;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            SpiffeIdentity serviceIdentity = extractSpiffeIdentity(exchange);
            if (serviceIdentity == null) {
                meterRegistry.counter("aegis.security.auth.rejections", "reason", "missing_mtls").increment();
                return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Missing Service Identity");
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                meterRegistry.counter("aegis.security.auth.rejections", "reason", "missing_jwt").increment();
                return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Missing User Token");
            }

            String token = authHeader.substring(7);
            UserTokenIdentity userIdentity;
            try {
                SignedJWT signedJWT = SignedJWT.parse(token);
                JWSVerifier verifier = new MACVerifier(secretKey.getBytes());
                
                if (!signedJWT.verify(verifier)) {
                    meterRegistry.counter("aegis.security.auth.rejections", "reason", "invalid_signature").increment();
                    return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Invalid Token Signature");
                }
                
                java.util.Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();
                if (exp != null) {
                    long now = System.currentTimeMillis();
                    long maxClockSkewMs = 60_000L;
                    if (now > exp.getTime() + maxClockSkewMs) {
                        meterRegistry.counter("aegis.security.auth.rejections", "reason", "expired_jwt").increment();
                        return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Token Expired");
                    }
                }

                String sub = signedJWT.getJWTClaimsSet().getSubject();
                if (sub == null) {
                    meterRegistry.counter("aegis.security.auth.rejections", "reason", "invalid_jwt").increment();
                    return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Missing User Subject in Token");
                }
                String jti = signedJWT.getJWTClaimsSet().getJWTID();
                userIdentity = new UserTokenIdentity(sub, jti, List.of());
            } catch (Exception e) {
                meterRegistry.counter("aegis.security.auth.rejections", "reason", "invalid_jwt").increment();
                return ErrorResponseUtil.writeProblemResponse(exchange, HttpStatus.UNAUTHORIZED, "Invalid User Token");
            }

            SecurityContextExchange securityContext = new SecurityContextExchange(
                    serviceIdentity,
                    userIdentity,
                    request.getMethod().name(),
                    request.getPath().value()
            );

            exchange.getAttributes().put(CONTEXT_KEY, securityContext);

            return chain.filter(exchange);
        };
    }

    private SpiffeIdentity extractSpiffeIdentity(ServerWebExchange exchange) {
        if (exchange.getRequest().getSslInfo() == null || 
            exchange.getRequest().getSslInfo().getPeerCertificates() == null || 
            exchange.getRequest().getSslInfo().getPeerCertificates().length == 0) {
            return null;
        }

        X509Certificate clientCert = exchange.getRequest().getSslInfo().getPeerCertificates()[0];
        try {
            Collection<List<?>> subjectAlternativeNames = clientCert.getSubjectAlternativeNames();
            if (subjectAlternativeNames != null) {
                for (List<?> san : subjectAlternativeNames) {
                    if (san.size() >= 2 && san.getFirst() instanceof Integer type && type == 6) {
                        String uri = (String) san.getLast(); // getLast() fetches the value reliably
                        if (uri != null && uri.startsWith("spiffe://")) {
                            Matcher matcher = SPIFFE_PATTERN.matcher(uri);
                            if (matcher.matches()) {
                                return new SpiffeIdentity(uri, matcher.group(1), matcher.group(2));
                            }
                            return new SpiffeIdentity(uri, "unknown", "unknown");
                        }
                    }
                }
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(ContextExtractionGatewayFilterFactory.class).warn("Failed to extract SPIFFE identity from certificate", e);
            return null;
        }
        return null; 
    }

    public static class Config {}
}
