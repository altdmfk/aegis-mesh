package com.aegis.gateway.util;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class DownstreamTokenMinter {

    private final AtomicReference<ActiveKey> activeKeyRef = new AtomicReference<>();

    public DownstreamTokenMinter(@Value("${gateway.security.secret-key}") String initialSecret) throws Exception {
        rotateSecret("v1", initialSecret);
    }

    public void rotateSecret(String kid, String secretKey) throws Exception {
        if (secretKey == null || secretKey.length() < 32) {
            throw new IllegalArgumentException("Secret key must be at least 256 bits for HS256");
        }
        activeKeyRef.set(new ActiveKey(kid, new MACSigner(secretKey.getBytes())));
    }

    public String mintInternalToken(String spiffeId, String userId) {
        ActiveKey currentKey = activeKeyRef.get();
        if (currentKey == null) {
            throw new IllegalStateException("Secret key state is uninitialized. Deny by default.");
        }

        try {
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(userId)
                    .claim("spiffe_id", spiffeId)
                    .issueTime(new Date())
                    .expirationTime(new Date(System.currentTimeMillis() + 60_000L)) // 60s TTL
                    .build();

            // Include kid in the JWS Header to indicate key version
            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
                    .keyID(currentKey.kid())
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            signedJWT.sign(currentKey.signer());
            
            return signedJWT.serialize(); // standard JWT, kid is in the header
        } catch (Exception e) {
            throw new RuntimeException("Failed to mint internal token", e);
        }
    }

    private record ActiveKey(String kid, MACSigner signer) {}
}
