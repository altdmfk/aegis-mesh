package com.aegis.gateway.model;

import java.io.Serializable;

public record CompositePolicyKey(String spiffeId, String userId, String resource, String action) implements Serializable {
    public String toHashedKey() {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            String raw = spiffeId + ":" + userId + ":" + resource + ":" + action;
            byte[] hash = digest.digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }
    
    @Override
    public String toString() {
        return spiffeId + ":" + userId + ":" + resource + ":" + action;
    }
}
