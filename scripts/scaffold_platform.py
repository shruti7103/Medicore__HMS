#!/usr/bin/env python3
"""Scaffold MediCore HMS backend services and frontend."""
import os
from pathlib import Path

ROOT = Path(r"d:\Shruti HMS")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
ADMIN_HASH = "$2b$12$cpVwcz6Ow4.879Cv5oNElOV0TUZTe3HxUXxrSTD8M0gpzD/Owf.nW"

def w(path, content):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  + {path.relative_to(ROOT)}")

# --- Config Server ---
w(BACKEND / "config-server/pom.xml", '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
    <artifactId>config-server</artifactId>
    <dependencies>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-config-server</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency>
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>''')

w(BACKEND / "config-server/src/main/java/com/medicore/config/ConfigServerApplication.java", '''package com.medicore.config;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) { SpringApplication.run(ConfigServerApplication.class, args); }
}''')

w(BACKEND / "config-server/src/main/resources/application.yml", '''server:
  port: 8888
spring:
  application:
    name: config-server
  profiles:
    active: native
  cloud:
    config:
      server:
        native:
          search-locations: classpath:/config
''')

shared_config = '''jwt:
  secret: medicore-super-secret-key-change-in-production-min-256-bits!!
  access-token-expiration-ms: 900000
  refresh-token-expiration-ms: 604800000

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true

spring:
  datasource:
    username: root
    password: ${DB_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQL8Dialect
'''

for svc, port, db in [
    ("auth-service", 8081, "auth_db"),
    ("patient-service", 8082, "patient_db"),
    ("doctor-service", 8083, "doctor_db"),
    ("appointment-service", 8084, "appointment_db"),
    ("billing-service", 8085, "billing_db"),
    ("pharmacy-service", 8086, "pharmacy_db"),
    ("notification-service", 8087, "notification_db"),
]:
    w(BACKEND / f"config-server/src/main/resources/config/{svc}.yml", f'''server:
  port: {port}
spring:
  application:
    name: {svc}
  datasource:
    url: jdbc:mysql://localhost:3306/{db}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
{shared_config}''')

# --- Eureka ---
w(BACKEND / "eureka-server/pom.xml", '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
    <artifactId>eureka-server</artifactId>
    <dependencies>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-server</artifactId></dependency>
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>''')

w(BACKEND / "eureka-server/src/main/java/com/medicore/eureka/EurekaServerApplication.java", '''package com.medicore.eureka;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) { SpringApplication.run(EurekaServerApplication.class, args); }
}''')

w(BACKEND / "eureka-server/src/main/resources/application.yml", '''server:
  port: 8761
spring:
  application:
    name: eureka-server
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
  server:
    enable-self-preservation: false
''')

# --- Gateway ---
w(BACKEND / "api-gateway/pom.xml", '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
    <artifactId>api-gateway</artifactId>
    <dependencies>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-gateway</artifactId></dependency>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
        <dependency><groupId>com.medicore</groupId><artifactId>common</artifactId></dependency>
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>''')

w(BACKEND / "api-gateway/src/main/java/com/medicore/gateway/GatewayApplication.java", '''package com.medicore.gateway;
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
@SpringBootApplication
@Import(CommonAutoConfiguration.class)
public class GatewayApplication {
    public static void main(String[] args) { SpringApplication.run(GatewayApplication.class, args); }
}''')

w(BACKEND / "api-gateway/src/main/java/com/medicore/gateway/filter/JwtGatewayFilter.java", '''package com.medicore.gateway.filter;
import com.medicore.common.security.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.List;
@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {
    private static final List<String> PUBLIC = List.of("/auth/login", "/auth/register", "/auth/refresh", "/actuator");
    private final JwtUtil jwtUtil;
    public JwtGatewayFilter(JwtUtil jwtUtil) { this.jwtUtil = jwtUtil; }
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        if (PUBLIC.stream().anyMatch(path::startsWith)) return chain.filter(exchange);
        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ") || !jwtUtil.isValid(auth.substring(7))) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        var claims = jwtUtil.parseClaims(auth.substring(7));
        var req = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .header("X-User-Email", claims.get("email", String.class))
                .build();
        return chain.filter(exchange.mutate().request(req).build());
    }
    @Override public int getOrder() { return -1; }
}''')

w(BACKEND / "api-gateway/src/main/resources/application.yml", '''server:
  port: 8080
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        - id: auth
          uri: lb://auth-service
          predicates: [Path=/auth/**]
        - id: patients
          uri: lb://patient-service
          predicates: [Path=/patients/**]
        - id: doctors
          uri: lb://doctor-service
          predicates: [Path=/doctors/**]
        - id: appointments
          uri: lb://appointment-service
          predicates: [Path=/appointments/**]
        - id: billing
          uri: lb://billing-service
          predicates: [Path=/billing/**]
        - id: pharmacy
          uri: lb://pharmacy-service
          predicates: [Path=/pharmacy/**]
        - id: notifications
          uri: lb://notification-service
          predicates: [Path=/notifications/**]
        - id: admin
          uri: lb://patient-service
          predicates: [Path=/admin/**]
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: ["http://localhost:5173", "http://localhost:3000"]
            allowedMethods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
            allowedHeaders: ["*"]
            allowCredentials: true
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
jwt:
  secret: medicore-super-secret-key-change-in-production-min-256-bits!!
''')

print("Platform services scaffolded.")
