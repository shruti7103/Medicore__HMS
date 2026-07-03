package com.medicore.auth.config;

import com.medicore.auth.entity.User;
import com.medicore.auth.repository.UserRepository;
import com.medicore.common.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seed("admin@medicore.local", "System Admin", Role.ADMIN);
        seed("doctor@medicore.local", "Dr. Sarah Patel", Role.DOCTOR);
        seed("reception@medicore.local", "Front Desk", Role.RECEPTIONIST);
        seed("patient@medicore.local", "John Patient", Role.PATIENT);
        seed("pharmacist@medicore.local", "Pharmacy Desk", Role.PHARMACIST);
        seed("nurse@medicore.local", "Priya Sharma", Role.NURSE);
    }

    private void seed(String email, String name, Role role) {
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                    user.setIsActive(true);
                    userRepository.save(user);
                },
                () -> userRepository.save(User.builder()
                        .name(name)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                        .role(role)
                        .isActive(true)
                        .build())
        );
    }
}
