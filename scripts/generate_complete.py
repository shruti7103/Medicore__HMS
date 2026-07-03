#!/usr/bin/env python3
"""Generate complete MediCore HMS backend + frontend."""
from pathlib import Path

ROOT = Path(r"d:\Shruti HMS")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend" / "src"
SQL = ROOT / "sql"
ADMIN_HASH = "$2b$12$cpVwcz6Ow4.879Cv5oNElOV0TUZTe3HxUXxrSTD8M0gpzD/Owf.nW"

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")

SERVICE_POM = '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
    <artifactId>{artifact}</artifactId>
    <dependencies>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
        <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
        <dependency><groupId>com.mysql</groupId><artifactId>mysql-connector-j</artifactId><scope>runtime</scope></dependency>
        <dependency><groupId>com.medicore</groupId><artifactId>common</artifactId></dependency>
        <dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
        {extra}
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugins></build>
</project>'''

def service_yml(svc_name, port, db):
    return f'''server:
  port: {port}
spring:
  application:
    name: {svc_name}
  datasource:
    url: jdbc:mysql://localhost:3306/{db}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: ${{DB_PASSWORD:root}}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQL8Dialect
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
jwt:
  secret: medicore-super-secret-key-change-in-production-min-256-bits!!
'''

def security_config(pkg, public_paths=""):
    permit = public_paths or '"/actuator/**"'
    return f'''package com.medicore.{pkg}.config;

import com.medicore.common.security.HeaderAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {{
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {{
        http.csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers({permit}).permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }}
}}'''

def app_class(pkg, name):
    return f'''package com.medicore.{pkg};

import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonAutoConfiguration.class)
public class {name} {{
    public static void main(String[] args) {{ SpringApplication.run({name}.class, args); }}
}}'''

def scaffold(artifact, pkg, port, db, extra=""):
    base = BACKEND / artifact
    w(base / "pom.xml", SERVICE_POM.format(artifact=artifact, extra=extra))
    cls = "".join(p.capitalize() for p in artifact.replace("-service", "").split("-")) + "ServiceApplication"
    w(base / f"src/main/java/com/medicore/{pkg}/{cls}.java", app_class(pkg, cls))
    w(base / f"src/main/java/com/medicore/{pkg}/config/SecurityConfig.java", security_config(pkg))
    w(base / "src/main/resources/application.yml", service_yml(artifact, port, db))

# ============ AUTH SERVICE ============
scaffold("auth-service", "auth", 8081, "auth_db")
w(BACKEND / "auth-service/src/main/java/com/medicore/auth/entity/User.java", '''package com.medicore.auth.entity;
import com.medicore.common.model.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=120) private String name;
    @Column(nullable=false,unique=true,length=160) private String email;
    @Column(name="password_hash",nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false) private LocalDateTime updatedAt;
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/entity/RefreshToken.java", '''package com.medicore.auth.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="refresh_tokens") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="token_hash",nullable=false) private String tokenHash;
    @Column(name="expires_at",nullable=false) private LocalDateTime expiresAt;
    @Column(nullable=false) private Boolean revoked=false;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/repository/UserRepository.java", '''package com.medicore.auth.repository;
import com.medicore.auth.entity.User;
import com.medicore.common.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    long countByRole(Role role);
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/repository/RefreshTokenRepository.java", '''package com.medicore.auth.repository;
import com.medicore.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/dto/AuthDtos.java", '''package com.medicore.auth.dto;
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
        private Long id; private String name; private String email; private Role role;
    }
    @Data public static class RefreshRequest { @NotBlank private String refreshToken; }
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/service/AuthService.java", '''package com.medicore.auth.service;
import com.medicore.auth.dto.AuthDtos.*;
import com.medicore.auth.entity.RefreshToken;
import com.medicore.auth.entity.User;
import com.medicore.auth.repository.RefreshTokenRepository;
import com.medicore.auth.repository.UserRepository;
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
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional public AuthResponse register(RegisterRequest req) {
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

    @Transactional public AuthResponse refresh(RefreshRequest req) {
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

    public UserResponse me() {
        Long id = SecurityUtils.currentUserId();
        return toResponse(userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Transactional public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) throw new BadRequestException("Email exists");
        User user = User.builder().name(req.getName()).email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword())).role(req.getRole()).isActive(true).build();
        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AuthResponse tokens(User user) {
        String access = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refresh = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder().userId(user.getId()).tokenHash(hash(refresh))
                .expiresAt(LocalDateTime.now().plusDays(7)).revoked(false).build());
        AuthResponse r = new AuthResponse();
        r.setAccessToken(access); r.setRefreshToken(refresh); r.setUser(toResponse(user));
        return r;
    }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId()); r.setName(u.getName()); r.setEmail(u.getEmail()); r.setRole(u.getRole());
        return r;
    }

    private String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/controller/AuthController.java", '''package com.medicore.auth.controller;
import com.medicore.auth.dto.AuthDtos.*;
import com.medicore.auth.service.AuthService;
import com.medicore.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    @PostMapping("/register") public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest req) { return ApiResponse.ok(authService.register(req)); }
    @PostMapping("/login") public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest req) { return ApiResponse.ok(authService.login(req)); }
    @PostMapping("/refresh") public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest req) { return ApiResponse.ok(authService.refresh(req)); }
    @PostMapping("/logout") public ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest req) { authService.logout(req); return ApiResponse.ok("Logged out", null); }
    @GetMapping("/me") public ApiResponse<UserResponse> me() { return ApiResponse.ok(authService.me()); }
    @PostMapping("/users") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest req) { return ApiResponse.ok(authService.createUser(req)); }
    @GetMapping("/users") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<List<UserResponse>> listUsers() { return ApiResponse.ok(authService.listUsers()); }
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/config/AuthSecurityConfig.java", '''package com.medicore.auth.config;
import com.medicore.common.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Configuration @EnableWebSecurity @EnableMethodSecurity
@RequiredArgsConstructor
public class AuthSecurityConfig {
    private final JwtUtil jwtUtil;
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a.requestMatchers("/auth/login","/auth/register","/auth/refresh","/actuator/**").permitAll().anyRequest().authenticated())
            .addFilterBefore(new JwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    private class JwtAuthFilter extends OncePerRequestFilter {
        @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
            String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && auth.startsWith("Bearer ") && jwtUtil.isValid(auth.substring(7))) {
                var claims = jwtUtil.parseClaims(auth.substring(7));
                var token = new UsernamePasswordAuthenticationToken(Long.parseLong(claims.getSubject()), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role", String.class))));
                SecurityContextHolder.getContext().setAuthentication(token);
            }
            chain.doFilter(req, res);
        }
    }
}''')

w(BACKEND / "auth-service/src/main/java/com/medicore/auth/config/DataInitializer.java", '''package com.medicore.auth.config;
import com.medicore.auth.entity.User;
import com.medicore.auth.repository.UserRepository;
import com.medicore.common.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Override public void run(String... args) {
        if (!userRepository.existsByEmail("admin@medicore.local")) {
            userRepository.save(User.builder().name("System Admin").email("admin@medicore.local")
                    .passwordHash(passwordEncoder.encode("Admin@123")).role(Role.ADMIN).isActive(true).build());
        }
    }
}''')

# ============ PATIENT SERVICE ============
scaffold("patient-service", "patient", 8082, "patient_db")

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/Gender.java", '''package com.medicore.patient.entity;
public enum Gender { MALE, FEMALE, OTHER }''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/Severity.java", '''package com.medicore.patient.entity;
public enum Severity { MILD, MODERATE, SEVERE }''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/Patient.java", '''package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name="patients") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="first_name",nullable=false,length=80) private String firstName;
    @Column(name="last_name",nullable=false,length=80) private String lastName;
    private LocalDate dob;
    @Enumerated(EnumType.STRING) private Gender gender;
    @Column(name="blood_group",length=5) private String bloodGroup;
    private String phone;
    private String address;
    @Column(name="emergency_contact") private String emergencyContact;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false) private LocalDateTime updatedAt;
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/MedicalHistory.java", '''package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity @Table(name="medical_history") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalHistory {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="doctor_id") private Long doctorId;
    @Column(name="visit_date",nullable=false) private LocalDate visitDate;
    private String diagnosis;
    private String notes;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/Vitals.java", '''package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="vitals") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Vitals {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="recorded_at",insertable=false,updatable=false) private LocalDateTime recordedAt;
    @Column(name="bp_systolic") private Integer bpSystolic;
    @Column(name="bp_diastolic") private Integer bpDiastolic;
    private Integer pulse;
    @Column(name="temperature_c") private BigDecimal temperatureC;
    @Column(name="weight_kg") private BigDecimal weightKg;
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/entity/Allergy.java", '''package com.medicore.patient.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="allergies") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Allergy {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(nullable=false,length=120) private String allergen;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Severity severity=Severity.MILD;
    private String notes;
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/repository/PatientRepository.java", '''package com.medicore.patient.repository;
import com.medicore.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);
    long count();
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/repository/MedicalHistoryRepository.java", '''package com.medicore.patient.repository;
import com.medicore.patient.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Long> {
    List<MedicalHistory> findByPatientIdOrderByVisitDateDesc(Long patientId);
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/repository/VitalsRepository.java", '''package com.medicore.patient.repository;
import com.medicore.patient.entity.Vitals;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface VitalsRepository extends JpaRepository<Vitals, Long> {
    List<Vitals> findByPatientIdOrderByRecordedAtDesc(Long patientId);
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/repository/AllergyRepository.java", '''package com.medicore.patient.repository;
import com.medicore.patient.entity.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AllergyRepository extends JpaRepository<Allergy, Long> {
    List<Allergy> findByPatientId(Long patientId);
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/dto/PatientDtos.java", '''package com.medicore.patient.dto;
import com.medicore.patient.entity.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
public class PatientDtos {
    @Data public static class PatientRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        private LocalDate dob;
        private Gender gender;
        private String bloodGroup;
        private String phone;
        private String address;
        private String emergencyContact;
    }
    @Data public static class PatientResponse {
        private Long id; private Long userId; private String firstName; private String lastName;
        private LocalDate dob; private Gender gender; private String bloodGroup;
        private String phone; private String address; private String emergencyContact;
        private List<MedicalHistoryResponse> history;
        private List<VitalsResponse> vitals;
        private List<AllergyResponse> allergies;
    }
    @Data public static class MedicalHistoryRequest {
        @NotNull private LocalDate visitDate;
        private Long doctorId;
        private String diagnosis;
        private String notes;
    }
    @Data public static class MedicalHistoryResponse {
        private Long id; private Long patientId; private Long doctorId;
        private LocalDate visitDate; private String diagnosis; private String notes;
    }
    @Data public static class VitalsRequest {
        private Integer bpSystolic; private Integer bpDiastolic;
        private Integer pulse; private BigDecimal temperatureC; private BigDecimal weightKg;
    }
    @Data public static class VitalsResponse {
        private Long id; private Integer bpSystolic; private Integer bpDiastolic;
        private Integer pulse; private BigDecimal temperatureC; private BigDecimal weightKg;
    }
    @Data public static class AllergyRequest {
        @NotBlank private String allergen;
        private Severity severity;
        private String notes;
    }
    @Data public static class AllergyResponse {
        private Long id; private String allergen; private Severity severity; private String notes;
    }
    @Data public static class AnalyticsSummary {
        private long totalPatients;
        private long totalDoctors;
        private long totalAppointments;
        private long totalInvoices;
    }
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/service/PatientService.java", '''package com.medicore.patient.service;
import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.patient.dto.PatientDtos.*;
import com.medicore.patient.entity.*;
import com.medicore.patient.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PatientService {
    private final PatientRepository patientRepository;
    private final MedicalHistoryRepository historyRepository;
    private final VitalsRepository vitalsRepository;
    private final AllergyRepository allergyRepository;

    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PatientResponse findById(Long id) {
        return toResponse(getPatient(id));
    }

    public PatientResponse me() {
        Long userId = SecurityUtils.currentUserId();
        Patient p = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return toDetailResponse(p);
    }

    @Transactional public PatientResponse create(PatientRequest req) {
        Long userId = SecurityUtils.currentUserId();
        if (patientRepository.findByUserId(userId).isPresent())
            throw new BadRequestException("Patient profile already exists");
        Patient p = Patient.builder().userId(userId).firstName(req.getFirstName()).lastName(req.getLastName())
                .dob(req.getDob()).gender(req.getGender()).bloodGroup(req.getBloodGroup())
                .phone(req.getPhone()).address(req.getAddress()).emergencyContact(req.getEmergencyContact()).build();
        return toResponse(patientRepository.save(p));
    }

    @Transactional public PatientResponse update(Long id, PatientRequest req) {
        Patient p = getPatient(id);
        checkAccess(p);
        p.setFirstName(req.getFirstName()); p.setLastName(req.getLastName());
        p.setDob(req.getDob()); p.setGender(req.getGender()); p.setBloodGroup(req.getBloodGroup());
        p.setPhone(req.getPhone()); p.setAddress(req.getAddress()); p.setEmergencyContact(req.getEmergencyContact());
        return toResponse(patientRepository.save(p));
    }

    @Transactional public void delete(Long id) {
        if (!SecurityUtils.hasRole(Role.ADMIN)) throw new BadRequestException("Only admin can delete");
        patientRepository.delete(getPatient(id));
    }

    @Transactional public MedicalHistoryResponse addHistory(Long id, MedicalHistoryRequest req) {
        getPatient(id);
        MedicalHistory h = MedicalHistory.builder().patientId(id).doctorId(req.getDoctorId())
                .visitDate(req.getVisitDate()).diagnosis(req.getDiagnosis()).notes(req.getNotes()).build();
        return toHistoryResponse(historyRepository.save(h));
    }

    @Transactional public VitalsResponse addVitals(Long id, VitalsRequest req) {
        getPatient(id);
        Vitals v = Vitals.builder().patientId(id).bpSystolic(req.getBpSystolic()).bpDiastolic(req.getBpDiastolic())
                .pulse(req.getPulse()).temperatureC(req.getTemperatureC()).weightKg(req.getWeightKg()).build();
        return toVitalsResponse(vitalsRepository.save(v));
    }

    @Transactional public AllergyResponse addAllergy(Long id, AllergyRequest req) {
        getPatient(id);
        Allergy a = Allergy.builder().patientId(id).allergen(req.getAllergen())
                .severity(req.getSeverity() != null ? req.getSeverity() : Severity.MILD).notes(req.getNotes()).build();
        return toAllergyResponse(allergyRepository.save(a));
    }

    public long countPatients() { return patientRepository.count(); }

    private Patient getPatient(Long id) {
        return patientRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    private void checkAccess(Patient p) {
        Role role = SecurityUtils.currentRole();
        if (role == Role.PATIENT && !p.getUserId().equals(SecurityUtils.currentUserId()))
            throw new BadRequestException("Access denied");
    }

    private PatientResponse toResponse(Patient p) {
        PatientResponse r = new PatientResponse();
        r.setId(p.getId()); r.setUserId(p.getUserId()); r.setFirstName(p.getFirstName()); r.setLastName(p.getLastName());
        r.setDob(p.getDob()); r.setGender(p.getGender()); r.setBloodGroup(p.getBloodGroup());
        r.setPhone(p.getPhone()); r.setAddress(p.getAddress()); r.setEmergencyContact(p.getEmergencyContact());
        return r;
    }

    private PatientResponse toDetailResponse(Patient p) {
        PatientResponse r = toResponse(p);
        r.setHistory(historyRepository.findByPatientIdOrderByVisitDateDesc(p.getId()).stream().map(this::toHistoryResponse).collect(Collectors.toList()));
        r.setVitals(vitalsRepository.findByPatientIdOrderByRecordedAtDesc(p.getId()).stream().map(this::toVitalsResponse).collect(Collectors.toList()));
        r.setAllergies(allergyRepository.findByPatientId(p.getId()).stream().map(this::toAllergyResponse).collect(Collectors.toList()));
        return r;
    }

    private MedicalHistoryResponse toHistoryResponse(MedicalHistory h) {
        MedicalHistoryResponse r = new MedicalHistoryResponse();
        r.setId(h.getId()); r.setPatientId(h.getPatientId()); r.setDoctorId(h.getDoctorId());
        r.setVisitDate(h.getVisitDate()); r.setDiagnosis(h.getDiagnosis()); r.setNotes(h.getNotes());
        return r;
    }

    private VitalsResponse toVitalsResponse(Vitals v) {
        VitalsResponse r = new VitalsResponse();
        r.setId(v.getId()); r.setBpSystolic(v.getBpSystolic()); r.setBpDiastolic(v.getBpDiastolic());
        r.setPulse(v.getPulse()); r.setTemperatureC(v.getTemperatureC()); r.setWeightKg(v.getWeightKg());
        return r;
    }

    private AllergyResponse toAllergyResponse(Allergy a) {
        AllergyResponse r = new AllergyResponse();
        r.setId(a.getId()); r.setAllergen(a.getAllergen()); r.setSeverity(a.getSeverity()); r.setNotes(a.getNotes());
        return r;
    }
}''')
