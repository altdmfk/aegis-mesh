package com.aegis.gateway.model;

import java.io.Serializable;

public record CompositePolicyKey(String spiffeId, String userId, String resource, String action) implements Serializable {
    @Override
    public String toString() {
        return spiffeId + ":" + userId + ":" + resource + ":" + action;
    }
}
