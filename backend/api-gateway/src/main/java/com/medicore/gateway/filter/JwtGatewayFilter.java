package com.medicore.gateway.filter;
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
    private static final List<String> PUBLIC = List.of("/auth/login", "/auth/register", "/auth/refresh", "/actuator", "/ws");
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
        String permissionsStr = "";
        try {
            @SuppressWarnings("unchecked")
            List<String> perms = (List<String>) claims.get("permissions", List.class);
            if (perms != null) {
                permissionsStr = String.join(",", perms);
            }
        } catch (Exception e) {}

        var req = exchange.getRequest().mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Role", claims.get("role", String.class))
                .header("X-User-Email", claims.get("email", String.class))
                .header("X-User-Permissions", permissionsStr)
                .build();
        return chain.filter(exchange.mutate().request(req).build());
    }
    @Override public int getOrder() { return -1; }
}