package com.medicore.common.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret = "medicore-super-secret-key-change-in-production-min-256-bits!!";
    private long accessTokenExpirationMs = 900_000;
    private long refreshTokenExpirationMs = 604_800_000;
}
