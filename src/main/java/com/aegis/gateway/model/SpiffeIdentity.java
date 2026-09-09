package com.aegis.gateway.model;

public record SpiffeIdentity(String spiffeId, String namespace, String serviceAccount) implements Identity {
}
