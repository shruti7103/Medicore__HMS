package com.medicore.auth.controller;

import com.medicore.auth.dto.AuthDtos.*;
import com.medicore.auth.service.AuthService;
import com.medicore.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register") public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) { return ApiResponse.ok(authService.register(req)); }
    @PostMapping("/login") public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ApiResponse.ok(authService.login(req)); }
    @PostMapping("/refresh") public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest req) { return ApiResponse.ok(authService.refresh(req)); }
    @PostMapping("/logout") public ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest req) { authService.logout(req); return ApiResponse.ok("Logged out", null); }
    @GetMapping("/me") public ApiResponse<UserResponse> me() { return ApiResponse.ok(authService.me()); }

    @PostMapping("/users") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest req) { return ApiResponse.ok(authService.createUser(req)); }
    @GetMapping("/users") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<List<UserResponse>> listUsers() { return ApiResponse.ok(authService.listUsers()); }
    @PutMapping("/users/{id}") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) { return ApiResponse.ok(authService.updateUser(id, req)); }
    @PatchMapping("/users/{id}/role") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<UserResponse> changeRole(@PathVariable Long id, @Valid @RequestBody ChangeRoleRequest req) { return ApiResponse.ok(authService.changeRole(id, req)); }
    @PatchMapping("/users/{id}/status") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<UserResponse> setStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) { return ApiResponse.ok(authService.setStatus(id, req)); }
    @PostMapping("/users/{id}/reset-password") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<Void> resetPassword(@PathVariable Long id) { authService.resetPassword(id); return ApiResponse.ok("Password reset to Reset@123", null); }
    @GetMapping("/audit-logs") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<List<AuditLogResponse>> auditLogs() { return ApiResponse.ok(authService.auditLogs()); }
}
