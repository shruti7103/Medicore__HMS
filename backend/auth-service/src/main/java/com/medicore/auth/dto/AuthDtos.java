package com.medicore.auth.dto;
import com.medicore.common.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;
public class AuthDtos {
    @Data public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }
    @Data public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank @Size(min=6) private String password;
    }
    @Data public static class CreateUserRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank @Size(min=6) private String password;
        @NotNull private Role role;
    }
    @Data public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private UserResponse user;
    }
    @Data public static class UserResponse {
        private Long id; private String name; private String email; private Role role; private Boolean isActive;
    }
    @Data public static class RefreshRequest { @NotBlank private String refreshToken; }
    @Data public static class ChangeRoleRequest { @NotNull private Role role; }
    @Data public static class StatusRequest { @NotNull private Boolean isActive; }
    @Data public static class UpdateUserRequest { @NotBlank private String name; @NotBlank @Email private String email; }
    @Data public static class AuditLogResponse {
        private Long id; private Long userId; private String action; private String entityType;
        private Long entityId; private String details; private java.time.LocalDateTime createdAt;
    }
}
