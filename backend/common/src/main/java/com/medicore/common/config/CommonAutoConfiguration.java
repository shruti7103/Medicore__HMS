package com.medicore.common.config;

import com.medicore.common.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = "com.medicore.common")
@EnableConfigurationProperties(JwtProperties.class)
public class CommonAutoConfiguration {
}
