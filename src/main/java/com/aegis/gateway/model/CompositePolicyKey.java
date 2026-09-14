package com.aegis.gateway.model;

import java.io.Serializable;

public record CompositePolicyKey(String spiffeId, String userId, String resource, String action) implements Serializable {
    public String toHashedKey() {
        String raw = spiffeId + ":" + userId + ":" + resource + ":" + action;
        return com.aegis.gateway.util.HashUtil.sha256Hex(raw);
    }
    
    @Override
    public String toString() {
        return spiffeId + ":" + userId + ":" + resource + ":" + action;
    }
}
