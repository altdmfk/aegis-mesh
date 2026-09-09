package com.aegis.gateway.model;

public sealed interface Identity permits SpiffeIdentity, UserTokenIdentity {
}
