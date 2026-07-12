package com.medicore.auth.service;
import com.medicore.auth.dto.AuthDtos.*;
import com.medicore.auth.entity.AuditLog;
import com.medicore.auth.entity.RefreshToken;
import com.medicore.auth.entity.User;
import com.medicore.auth.repository.AuditLogRepository;
import com.medicore.auth.repository.RefreshTokenRepository;
import com.medicore.auth.repository.UserRepository;
import com.medicore.auth.repository.RolePermissionRepository;
import com.medicore.auth.entity.RolePermission;
import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.JwtUtil;
import com.medicore.common.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @SuppressWarnings("null") @Transactional public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) throw new BadRequestException("Email already registered");
        User user = User.builder().name(req.getName()).email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword())).role(Role.PATIENT).isActive(true).build();
        return tokens(userRepository.save(user));
    }

    @Transactional public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail()).orElseThrow(() -> new BadRequestException("Invalid credentials"));
        if (!user.getIsActive() || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new BadRequestException("Invalid credentials");
        return tokens(user);
    }

    @SuppressWarnings("null") @Transactional public AuthResponse refresh(RefreshRequest req) {
        String hash = hash(req.getRefreshToken());
        RefreshToken rt = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) throw new BadRequestException("Refresh token expired");
        rt.setRevoked(true);
        refreshTokenRepository.save(rt);
        User user = userRepository.findById(rt.getUserId()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return tokens(user);
    }

    @Transactional public void logout(RefreshRequest req) {
        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(req.getRefreshToken()))
                .ifPresent(t -> { t.setRevoked(true); refreshTokenRepository.save(t); });
    }

    @SuppressWarnings("null")
    public UserResponse me() {
        Long id = SecurityUtils.currentUserId();
        return toResponse(userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @SuppressWarnings("null") @Transactional public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) throw new BadRequestException("Email exists");
        User user = User.builder().name(req.getName()).email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword())).role(req.getRole()).isActive(true).build();
        user = userRepository.save(user);
        audit("CREATE_USER", "User", user.getId(), "Created " + user.getEmail());
        return toResponse(user);
    }

    @Transactional public UserResponse updateUser(Long id, UpdateUserRequest req) {
        User user = getUser(id);
        user.setName(req.getName()); user.setEmail(req.getEmail());
        user = userRepository.save(user);
        audit("UPDATE_USER", "User", id, "Updated profile");
        return toResponse(user);
    }

    @Transactional public UserResponse changeRole(Long id, ChangeRoleRequest req) {
        User user = getUser(id);
        user.setRole(req.getRole());
        user = userRepository.save(user);
        audit("CHANGE_ROLE", "User", id, "Role -> " + req.getRole());
        return toResponse(user);
    }

    @Transactional public UserResponse setStatus(Long id, StatusRequest req) {
        User user = getUser(id);
        user.setIsActive(req.getIsActive());
        user = userRepository.save(user);
        audit(req.getIsActive() ? "ACTIVATE_USER" : "DEACTIVATE_USER", "User", id, user.getEmail());
        return toResponse(user);
    }

    @Transactional public void resetPassword(Long id) {
        User user = getUser(id);
        user.setPasswordHash(passwordEncoder.encode("Reset@123"));
        userRepository.save(user);
        audit("RESET_PASSWORD", "User", id, user.getEmail());
    }

    public List<AuditLogResponse> auditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc().stream().map(a -> {
            AuditLogResponse r = new AuditLogResponse();
            r.setId(a.getId()); r.setUserId(a.getUserId()); r.setAction(a.getAction());
            r.setEntityType(a.getEntityType()); r.setEntityId(a.getEntityId());
            r.setDetails(a.getDetails()); r.setCreatedAt(a.getCreatedAt());
            return r;
        }).collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @SuppressWarnings("null")
    private void audit(String action, String entityType, Long entityId, String details) {
        auditLogRepository.save(AuditLog.builder()
                .userId(SecurityUtils.currentUserId()).action(action).entityType(entityType)
                .entityId(entityId).details(details).build());
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @SuppressWarnings("null")
    private AuthResponse tokens(User user) {
        List<String> permissions = rolePermissionRepository.findByRoleAndIsEnabledTrue(user.getRole().name())
                .stream().map(RolePermission::getPermission).collect(Collectors.toList());
        String access = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole(), permissions);
        String refresh = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder().userId(user.getId()).tokenHash(hash(refresh))
                .expiresAt(LocalDateTime.now().plusDays(7)).revoked(false).build());
        AuthResponse r = new AuthResponse();
        r.setAccessToken(access); r.setRefreshToken(refresh); r.setUser(toResponse(user));
        return r;
    }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId()); r.setName(u.getName()); r.setEmail(u.getEmail()); r.setRole(u.getRole()); r.setIsActive(u.getIsActive());
        return r;
    }

    private String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}
