#!/usr/bin/env python3
"""Generate remaining MediCore HMS backend services."""
from pathlib import Path

ROOT = Path(r"d:\Shruti HMS")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend" / "src"

def w(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"+ {p.relative_to(ROOT)}")

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
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
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

def security_config(pkg):
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
                .requestMatchers("/actuator/**").permitAll()
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

# Remove duplicate auth files
for f in [
    BACKEND / "auth-service/src/main/java/com/medicore/auth/model/User.java",
    BACKEND / "auth-service/src/main/java/com/medicore/auth/config/SecurityConfig.java",
]:
    if f.exists():
        f.unlink()
        print(f"- removed {f.relative_to(ROOT)}")

# ============ PATIENT CONTROLLERS ============
w(BACKEND / "patient-service/src/main/java/com/medicore/patient/controller/PatientController.java", '''package com.medicore.patient.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.patient.dto.PatientDtos.*;
import com.medicore.patient.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<PatientResponse>> list() {
        return ApiResponse.ok(patientService.findAll());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<PatientResponse> me() {
        return ApiResponse.ok(patientService.me());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<PatientResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(patientService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ApiResponse<PatientResponse> create(@Valid @RequestBody PatientRequest req) {
        return ApiResponse.ok(patientService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<PatientResponse> update(@PathVariable Long id, @Valid @RequestBody PatientRequest req) {
        return ApiResponse.ok(patientService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        patientService.delete(id);
        return ApiResponse.ok("Deleted", null);
    }

    @PostMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<MedicalHistoryResponse> addHistory(@PathVariable Long id, @Valid @RequestBody MedicalHistoryRequest req) {
        return ApiResponse.ok(patientService.addHistory(id, req));
    }

    @PostMapping("/{id}/vitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<VitalsResponse> addVitals(@PathVariable Long id, @Valid @RequestBody VitalsRequest req) {
        return ApiResponse.ok(patientService.addVitals(id, req));
    }

    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<AllergyResponse> addAllergy(@PathVariable Long id, @Valid @RequestBody AllergyRequest req) {
        return ApiResponse.ok(patientService.addAllergy(id, req));
    }
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/controller/AdminController.java", '''package com.medicore.patient.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.patient.dto.PatientDtos.AnalyticsSummary;
import com.medicore.patient.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/analytics/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AnalyticsSummary> summary() {
        return ApiResponse.ok(adminAnalyticsService.getSummary());
    }
}''')

w(BACKEND / "patient-service/src/main/java/com/medicore/patient/service/AdminAnalyticsService.java", '''package com.medicore.patient.service;

import com.medicore.patient.dto.PatientDtos.AnalyticsSummary;
import com.medicore.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {
    private final PatientRepository patientRepository;

    public AnalyticsSummary getSummary() {
        AnalyticsSummary s = new AnalyticsSummary();
        s.setTotalPatients(patientRepository.count());
        s.setTotalDoctors(0);
        s.setTotalAppointments(0);
        s.setTotalInvoices(0);
        return s;
    }
}''')

# ============ DOCTOR SERVICE ============
scaffold("doctor-service", "doctor", 8083, "doctor_db")

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/entity/DayOfWeek.java", '''package com.medicore.doctor.entity;
public enum DayOfWeek { MON, TUE, WED, THU, FRI, SAT, SUN }''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/entity/Doctor.java", '''package com.medicore.doctor.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="doctors") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Doctor {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="first_name",nullable=false,length=80) private String firstName;
    @Column(name="last_name",nullable=false,length=80) private String lastName;
    @Column(nullable=false,length=120) private String specialization;
    @Column(nullable=false,length=120) private String department;
    @Column(name="experience_years",nullable=false) private Integer experienceYears=0;
    @Column(name="consultation_fee",nullable=false) private BigDecimal consultationFee=BigDecimal.ZERO;
    private String bio;
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/entity/AvailabilitySlot.java", '''package com.medicore.doctor.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity @Table(name="availability_slots") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilitySlot {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Enumerated(EnumType.STRING) @Column(name="day_of_week",nullable=false) private DayOfWeek dayOfWeek;
    @Column(name="start_time",nullable=false) private LocalTime startTime;
    @Column(name="end_time",nullable=false) private LocalTime endTime;
    @Column(name="slot_duration_mins",nullable=false) private Integer slotDurationMins=30;
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/repository/DoctorRepository.java", '''package com.medicore.doctor.repository;
import com.medicore.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    List<Doctor> findByIsActiveTrue();
    List<Doctor> findByDepartment(String department);
    long countByIsActiveTrue();
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/repository/AvailabilitySlotRepository.java", '''package com.medicore.doctor.repository;
import com.medicore.doctor.entity.AvailabilitySlot;
import com.medicore.doctor.entity.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByDoctorIdAndIsActiveTrue(Long doctorId);
    List<AvailabilitySlot> findByDoctorIdAndDayOfWeekAndIsActiveTrue(Long doctorId, DayOfWeek dayOfWeek);
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/dto/DoctorDtos.java", '''package com.medicore.doctor.dto;
import com.medicore.doctor.entity.DayOfWeek;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class DoctorDtos {
    @Data public static class DoctorRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank private String specialization;
        @NotBlank private String department;
        private Integer experienceYears;
        private BigDecimal consultationFee;
        private String bio;
    }
    @Data public static class DoctorResponse {
        private Long id; private Long userId; private String firstName; private String lastName;
        private String specialization; private String department; private Integer experienceYears;
        private BigDecimal consultationFee; private String bio; private Boolean isActive;
    }
    @Data public static class SlotRequest {
        @NotNull private DayOfWeek dayOfWeek;
        @NotNull private LocalTime startTime;
        @NotNull private LocalTime endTime;
        private Integer slotDurationMins;
    }
    @Data public static class SlotResponse {
        private Long id; private DayOfWeek dayOfWeek;
        private LocalTime startTime; private LocalTime endTime; private Integer slotDurationMins;
    }
    @Data public static class OpenSlot {
        private LocalDateTime slotStart;
        private LocalDateTime slotEnd;
        private boolean available;
    }
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/service/DoctorService.java", '''package com.medicore.doctor.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.doctor.dto.DoctorDtos.*;
import com.medicore.doctor.entity.*;
import com.medicore.doctor.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final AvailabilitySlotRepository slotRepository;

    public List<DoctorResponse> findAll() {
        return doctorRepository.findByIsActiveTrue().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DoctorResponse findById(Long id) {
        return toResponse(getDoctor(id));
    }

    public DoctorResponse me() {
        return doctorRepository.findByUserId(SecurityUtils.currentUserId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }

    @Transactional public DoctorResponse create(DoctorRequest req) {
        Long userId = SecurityUtils.currentUserId();
        if (doctorRepository.findByUserId(userId).isPresent())
            throw new BadRequestException("Doctor profile already exists");
        Doctor d = Doctor.builder().userId(userId).firstName(req.getFirstName()).lastName(req.getLastName())
                .specialization(req.getSpecialization()).department(req.getDepartment())
                .experienceYears(req.getExperienceYears() != null ? req.getExperienceYears() : 0)
                .consultationFee(req.getConsultationFee() != null ? req.getConsultationFee() : java.math.BigDecimal.ZERO)
                .bio(req.getBio()).isActive(true).build();
        return toResponse(doctorRepository.save(d));
    }

    @Transactional public DoctorResponse update(Long id, DoctorRequest req) {
        Doctor d = getDoctor(id);
        d.setFirstName(req.getFirstName()); d.setLastName(req.getLastName());
        d.setSpecialization(req.getSpecialization()); d.setDepartment(req.getDepartment());
        if (req.getExperienceYears() != null) d.setExperienceYears(req.getExperienceYears());
        if (req.getConsultationFee() != null) d.setConsultationFee(req.getConsultationFee());
        d.setBio(req.getBio());
        return toResponse(doctorRepository.save(d));
    }

    @Transactional public SlotResponse addSlot(Long doctorId, SlotRequest req) {
        getDoctor(doctorId);
        AvailabilitySlot slot = AvailabilitySlot.builder().doctorId(doctorId).dayOfWeek(req.getDayOfWeek())
                .startTime(req.getStartTime()).endTime(req.getEndTime())
                .slotDurationMins(req.getSlotDurationMins() != null ? req.getSlotDurationMins() : 30).isActive(true).build();
        return toSlotResponse(slotRepository.save(slot));
    }

    public List<SlotResponse> listSlots(Long doctorId) {
        return slotRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream().map(this::toSlotResponse).collect(Collectors.toList());
    }

    public List<OpenSlot> openSlots(Long doctorId, LocalDate date) {
        getDoctor(doctorId);
        DayOfWeek dow = DayOfWeek.valueOf(date.getDayOfWeek().name().substring(0, 3));
        List<AvailabilitySlot> templates = slotRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dow);
        List<OpenSlot> result = new ArrayList<>();
        for (AvailabilitySlot t : templates) {
            LocalDateTime cursor = LocalDateTime.of(date, t.getStartTime());
            LocalDateTime end = LocalDateTime.of(date, t.getEndTime());
            int mins = t.getSlotDurationMins();
            while (cursor.plusMinutes(mins).compareTo(end) <= 0) {
                OpenSlot os = new OpenSlot();
                os.setSlotStart(cursor);
                os.setSlotEnd(cursor.plusMinutes(mins));
                os.setAvailable(true);
                result.add(os);
                cursor = cursor.plusMinutes(mins);
            }
        }
        return result;
    }

    public long countActiveDoctors() { return doctorRepository.countByIsActiveTrue(); }

    private Doctor getDoctor(Long id) {
        return doctorRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
    }

    private DoctorResponse toResponse(Doctor d) {
        DoctorResponse r = new DoctorResponse();
        r.setId(d.getId()); r.setUserId(d.getUserId()); r.setFirstName(d.getFirstName()); r.setLastName(d.getLastName());
        r.setSpecialization(d.getSpecialization()); r.setDepartment(d.getDepartment());
        r.setExperienceYears(d.getExperienceYears()); r.setConsultationFee(d.getConsultationFee());
        r.setBio(d.getBio()); r.setIsActive(d.getIsActive());
        return r;
    }

    private SlotResponse toSlotResponse(AvailabilitySlot s) {
        SlotResponse r = new SlotResponse();
        r.setId(s.getId()); r.setDayOfWeek(s.getDayOfWeek());
        r.setStartTime(s.getStartTime()); r.setEndTime(s.getEndTime()); r.setSlotDurationMins(s.getSlotDurationMins());
        return r;
    }
}''')

w(BACKEND / "doctor-service/src/main/java/com/medicore/doctor/controller/DoctorController.java", '''package com.medicore.doctor.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.doctor.dto.DoctorDtos.*;
import com.medicore.doctor.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/doctors") @RequiredArgsConstructor
public class DoctorController {
    private final DoctorService doctorService;

    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<DoctorResponse>> list() { return ApiResponse.ok(doctorService.findAll()); }

    @GetMapping("/me") @PreAuthorize("hasRole('DOCTOR')")
    public ApiResponse<DoctorResponse> me() { return ApiResponse.ok(doctorService.me()); }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<DoctorResponse> get(@PathVariable Long id) { return ApiResponse.ok(doctorService.findById(id)); }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorResponse> create(@Valid @RequestBody DoctorRequest req) { return ApiResponse.ok(doctorService.create(req)); }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<DoctorResponse> update(@PathVariable Long id, @Valid @RequestBody DoctorRequest req) { return ApiResponse.ok(doctorService.update(id, req)); }

    @PostMapping("/{id}/slots") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ApiResponse<SlotResponse> addSlot(@PathVariable Long id, @Valid @RequestBody SlotRequest req) { return ApiResponse.ok(doctorService.addSlot(id, req)); }

    @GetMapping("/{id}/slots") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<?> slots(@PathVariable Long id, @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date != null) return ApiResponse.ok(doctorService.openSlots(id, date));
        return ApiResponse.ok(doctorService.listSlots(id));
    }
}''')

# ============ APPOINTMENT SERVICE ============
scaffold("appointment-service", "appointment", 8084, "appointment_db")

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/entity/AppointmentStatus.java", '''package com.medicore.appointment.entity;
public enum AppointmentStatus { PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }''')

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/entity/Appointment.java", '''package com.medicore.appointment.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="appointments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Column(name="slot_start",nullable=false) private LocalDateTime slotStart;
    @Column(name="slot_end",nullable=false) private LocalDateTime slotEnd;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private AppointmentStatus status=AppointmentStatus.PENDING;
    private String reason;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false) private LocalDateTime updatedAt;
}''')

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/repository/AppointmentRepository.java", '''package com.medicore.appointment.repository;
import com.medicore.appointment.entity.Appointment;
import com.medicore.appointment.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderBySlotStartDesc(Long patientId);
    List<Appointment> findByDoctorIdOrderBySlotStartDesc(Long doctorId);
    List<Appointment> findByDoctorIdAndSlotStartBetween(Long doctorId, LocalDateTime start, LocalDateTime end);
    Optional<Appointment> findByDoctorIdAndSlotStart(Long doctorId, LocalDateTime slotStart);
    long count();
    long countByStatus(AppointmentStatus status);
}''')

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/dto/AppointmentDtos.java", '''package com.medicore.appointment.dto;
import com.medicore.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class AppointmentDtos {
    @Data public static class BookRequest {
        @NotNull private Long patientId;
        @NotNull private Long doctorId;
        @NotNull private LocalDateTime slotStart;
        @NotNull private LocalDateTime slotEnd;
        private String reason;
    }
    @Data public static class StatusRequest {
        @NotNull private AppointmentStatus status;
    }
    @Data public static class AppointmentResponse {
        private Long id; private Long patientId; private Long doctorId;
        private LocalDateTime slotStart; private LocalDateTime slotEnd;
        private AppointmentStatus status; private String reason;
    }
}''')

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/service/AppointmentService.java", '''package com.medicore.appointment.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.model.Role;
import com.medicore.common.security.SecurityUtils;
import com.medicore.appointment.dto.AppointmentDtos.*;
import com.medicore.appointment.entity.*;
import com.medicore.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;

    public List<AppointmentResponse> findAll() {
        return appointmentRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AppointmentResponse findById(Long id) {
        return toResponse(get(id));
    }

    public List<AppointmentResponse> byPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderBySlotStartDesc(patientId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AppointmentResponse> byDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderBySlotStartDesc(doctorId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional public AppointmentResponse book(BookRequest req) {
        if (appointmentRepository.findByDoctorIdAndSlotStart(req.getDoctorId(), req.getSlotStart()).isPresent())
            throw new BadRequestException("Slot already booked");
        Appointment a = Appointment.builder().patientId(req.getPatientId()).doctorId(req.getDoctorId())
                .slotStart(req.getSlotStart()).slotEnd(req.getSlotEnd()).reason(req.getReason())
                .status(AppointmentStatus.PENDING).build();
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional public AppointmentResponse updateStatus(Long id, StatusRequest req) {
        Appointment a = get(id);
        a.setStatus(req.getStatus());
        return toResponse(appointmentRepository.save(a));
    }

    @Transactional public AppointmentResponse reschedule(Long id, BookRequest req) {
        Appointment a = get(id);
        if (appointmentRepository.findByDoctorIdAndSlotStart(req.getDoctorId(), req.getSlotStart())
                .filter(existing -> !existing.getId().equals(id)).isPresent())
            throw new BadRequestException("Slot already booked");
        a.setDoctorId(req.getDoctorId()); a.setPatientId(req.getPatientId());
        a.setSlotStart(req.getSlotStart()); a.setSlotEnd(req.getSlotEnd()); a.setReason(req.getReason());
        return toResponse(appointmentRepository.save(a));
    }

    public long countAll() { return appointmentRepository.count(); }

    private Appointment get(Long id) {
        return appointmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
    }

    private AppointmentResponse toResponse(Appointment a) {
        AppointmentResponse r = new AppointmentResponse();
        r.setId(a.getId()); r.setPatientId(a.getPatientId()); r.setDoctorId(a.getDoctorId());
        r.setSlotStart(a.getSlotStart()); r.setSlotEnd(a.getSlotEnd());
        r.setStatus(a.getStatus()); r.setReason(a.getReason());
        return r;
    }
}''')

w(BACKEND / "appointment-service/src/main/java/com/medicore/appointment/controller/AppointmentController.java", '''package com.medicore.appointment.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.appointment.dto.AppointmentDtos.*;
import com.medicore.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/appointments") @RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointmentService;

    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<AppointmentResponse>> list() { return ApiResponse.ok(appointmentService.findAll()); }

    @GetMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<AppointmentResponse> get(@PathVariable Long id) { return ApiResponse.ok(appointmentService.findById(id)); }

    @GetMapping("/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<AppointmentResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(appointmentService.byPatient(patientId)); }

    @GetMapping("/doctor/{doctorId}") @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','RECEPTIONIST')")
    public ApiResponse<List<AppointmentResponse>> byDoctor(@PathVariable Long doctorId) { return ApiResponse.ok(appointmentService.byDoctor(doctorId)); }

    @PostMapping @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST')")
    public ApiResponse<AppointmentResponse> book(@Valid @RequestBody BookRequest req) { return ApiResponse.ok(appointmentService.book(req)); }

    @PatchMapping("/{id}/status") @PreAuthorize("hasAnyRole('DOCTOR','RECEPTIONIST','ADMIN')")
    public ApiResponse<AppointmentResponse> status(@PathVariable Long id, @Valid @RequestBody StatusRequest req) { return ApiResponse.ok(appointmentService.updateStatus(id, req)); }

    @PutMapping("/{id}/reschedule") @PreAuthorize("hasAnyRole('RECEPTIONIST','PATIENT','ADMIN')")
    public ApiResponse<AppointmentResponse> reschedule(@PathVariable Long id, @Valid @RequestBody BookRequest req) { return ApiResponse.ok(appointmentService.reschedule(id, req)); }
}''')

# ============ BILLING SERVICE ============
scaffold("billing-service", "billing", 8085, "billing_db")

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/entity/InvoiceStatus.java", '''package com.medicore.billing.entity;
public enum InvoiceStatus { UNPAID, PAID, CANCELLED }''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/entity/PaymentMethod.java", '''package com.medicore.billing.entity;
public enum PaymentMethod { CASH, CARD, UPI, INSURANCE }''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/entity/Invoice.java", '''package com.medicore.billing.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="invoices") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="appointment_id",nullable=false) private Long appointmentId;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Column(nullable=false) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private InvoiceStatus status=InvoiceStatus.UNPAID;
    @Column(name="issued_at",insertable=false,updatable=false) private LocalDateTime issuedAt;
    @Column(name="due_date") private LocalDate dueDate;
}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/entity/Payment.java", '''package com.medicore.billing.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="payments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="invoice_id",nullable=false) private Long invoiceId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentMethod method;
    @Column(name="transaction_ref") private String transactionRef;
    @Column(nullable=false) private BigDecimal amount;
    @Column(name="paid_at",insertable=false,updatable=false) private LocalDateTime paidAt;
}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/repository/InvoiceRepository.java", '''package com.medicore.billing.repository;
import com.medicore.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByPatientIdOrderByIssuedAtDesc(Long patientId);
    Optional<Invoice> findByAppointmentId(Long appointmentId);
    long count();
}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/repository/PaymentRepository.java", '''package com.medicore.billing.repository;
import com.medicore.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PaymentRepository extends JpaRepository<Payment, Long> {}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/dto/BillingDtos.java", '''package com.medicore.billing.dto;
import com.medicore.billing.entity.InvoiceStatus;
import com.medicore.billing.entity.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class BillingDtos {
    @Data public static class InvoiceRequest {
        @NotNull private Long appointmentId;
        @NotNull private Long patientId;
        @NotNull private BigDecimal amount;
        private LocalDate dueDate;
    }
    @Data public static class PayRequest {
        @NotNull private Long invoiceId;
        @NotNull private PaymentMethod method;
        private String transactionRef;
        @NotNull private BigDecimal amount;
    }
    @Data public static class InvoiceResponse {
        private Long id; private Long appointmentId; private Long patientId;
        private BigDecimal amount; private InvoiceStatus status;
        private LocalDateTime issuedAt; private LocalDate dueDate;
    }
    @Data public static class PaymentResponse {
        private Long id; private Long invoiceId; private PaymentMethod method;
        private String transactionRef; private BigDecimal amount; private LocalDateTime paidAt;
    }
}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/service/BillingService.java", '''package com.medicore.billing.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.billing.dto.BillingDtos.*;
import com.medicore.billing.entity.*;
import com.medicore.billing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class BillingService {
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public List<InvoiceResponse> listInvoices() {
        return invoiceRepository.findAll().stream().map(this::toInvoice).collect(Collectors.toList());
    }

    public List<InvoiceResponse> byPatient(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByIssuedAtDesc(patientId).stream().map(this::toInvoice).collect(Collectors.toList());
    }

    @Transactional public InvoiceResponse createInvoice(InvoiceRequest req) {
        if (invoiceRepository.findByAppointmentId(req.getAppointmentId()).isPresent())
            throw new BadRequestException("Invoice already exists for appointment");
        Invoice inv = Invoice.builder().appointmentId(req.getAppointmentId()).patientId(req.getPatientId())
                .amount(req.getAmount()).status(InvoiceStatus.UNPAID).dueDate(req.getDueDate()).build();
        return toInvoice(invoiceRepository.save(inv));
    }

    @Transactional public InvoiceResponse createForAppointment(Long appointmentId, InvoiceRequest req) {
        req.setAppointmentId(appointmentId);
        return createInvoice(req);
    }

    @Transactional public PaymentResponse pay(PayRequest req) {
        Invoice inv = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        if (inv.getStatus() == InvoiceStatus.PAID) throw new BadRequestException("Invoice already paid");
        Payment p = Payment.builder().invoiceId(inv.getId()).method(req.getMethod())
                .transactionRef(req.getTransactionRef()).amount(req.getAmount()).build();
        paymentRepository.save(p);
        inv.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(inv);
        return toPayment(p);
    }

    public long countInvoices() { return invoiceRepository.count(); }

    private InvoiceResponse toInvoice(Invoice i) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(i.getId()); r.setAppointmentId(i.getAppointmentId()); r.setPatientId(i.getPatientId());
        r.setAmount(i.getAmount()); r.setStatus(i.getStatus()); r.setIssuedAt(i.getIssuedAt()); r.setDueDate(i.getDueDate());
        return r;
    }

    private PaymentResponse toPayment(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId()); r.setInvoiceId(p.getInvoiceId()); r.setMethod(p.getMethod());
        r.setTransactionRef(p.getTransactionRef()); r.setAmount(p.getAmount()); r.setPaidAt(p.getPaidAt());
        return r;
    }
}''')

w(BACKEND / "billing-service/src/main/java/com/medicore/billing/controller/BillingController.java", '''package com.medicore.billing.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.billing.dto.BillingDtos.*;
import com.medicore.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/billing") @RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @GetMapping("/invoices") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<InvoiceResponse>> list() { return ApiResponse.ok(billingService.listInvoices()); }

    @GetMapping("/invoices/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','PATIENT')")
    public ApiResponse<List<InvoiceResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(billingService.byPatient(patientId)); }

    @PostMapping("/invoices") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InvoiceResponse> create(@Valid @RequestBody InvoiceRequest req) { return ApiResponse.ok(billingService.createInvoice(req)); }

    @PostMapping("/invoices/{appointmentId}") @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
    public ApiResponse<InvoiceResponse> createForAppt(@PathVariable Long appointmentId, @Valid @RequestBody InvoiceRequest req) {
        return ApiResponse.ok(billingService.createForAppointment(appointmentId, req));
    }

    @PostMapping("/pay") @PreAuthorize("hasAnyRole('PATIENT','RECEPTIONIST','ADMIN')")
    public ApiResponse<PaymentResponse> pay(@Valid @RequestBody PayRequest req) { return ApiResponse.ok(billingService.pay(req)); }
}''')

# ============ PHARMACY SERVICE ============
scaffold("pharmacy-service", "pharmacy", 8086, "pharmacy_db")

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/entity/PrescriptionStatus.java", '''package com.medicore.pharmacy.entity;
public enum PrescriptionStatus { PENDING, DISPENSED, CANCELLED }''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/entity/Medicine.java", '''package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="medicines") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Medicine {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=150) private String name;
    private String description;
    @Column(name="stock_qty",nullable=false) private Integer stockQty=0;
    @Column(name="unit_price",nullable=false) private BigDecimal unitPrice=BigDecimal.ZERO;
    @Column(name="reorder_level",nullable=false) private Integer reorderLevel=10;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/entity/Prescription.java", '''package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="prescriptions") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescription {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="appointment_id",nullable=false) private Long appointmentId;
    @Column(name="doctor_id",nullable=false) private Long doctorId;
    @Column(name="patient_id",nullable=false) private Long patientId;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PrescriptionStatus status=PrescriptionStatus.PENDING;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @OneToMany(mappedBy="prescription", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private List<PrescriptionItem> items = new ArrayList<>();
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/entity/PrescriptionItem.java", '''package com.medicore.pharmacy.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="prescription_items") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrescriptionItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="prescription_id",nullable=false) private Prescription prescription;
    @Column(name="medicine_id",nullable=false) private Long medicineId;
    @Column(nullable=false,length=80) private String dosage;
    @Column(nullable=false,length=80) private String frequency;
    @Column(name="duration_days",nullable=false) private Integer durationDays;
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/repository/MedicineRepository.java", '''package com.medicore.pharmacy.repository;
import com.medicore.pharmacy.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByStockQtyLessThanEqual(Integer reorderLevel);
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/repository/PrescriptionRepository.java", '''package com.medicore.pharmacy.repository;
import com.medicore.pharmacy.entity.Prescription;
import com.medicore.pharmacy.entity.PrescriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByStatusOrderByCreatedAtDesc(PrescriptionStatus status);
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/dto/PharmacyDtos.java", '''package com.medicore.pharmacy.dto;
import com.medicore.pharmacy.entity.PrescriptionStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PharmacyDtos {
    @Data public static class MedicineRequest {
        @NotBlank private String name;
        private String description;
        @NotNull private Integer stockQty;
        @NotNull private BigDecimal unitPrice;
        private Integer reorderLevel;
    }
    @Data public static class MedicineResponse {
        private Long id; private String name; private String description;
        private Integer stockQty; private BigDecimal unitPrice; private Integer reorderLevel;
    }
    @Data public static class PrescriptionItemRequest {
        @NotNull private Long medicineId;
        @NotBlank private String dosage;
        @NotBlank private String frequency;
        @NotNull private Integer durationDays;
    }
    @Data public static class PrescriptionRequest {
        @NotNull private Long appointmentId;
        @NotNull private Long doctorId;
        @NotNull private Long patientId;
        @NotEmpty private List<PrescriptionItemRequest> items;
    }
    @Data public static class PrescriptionItemResponse {
        private Long id; private Long medicineId; private String dosage; private String frequency; private Integer durationDays;
    }
    @Data public static class PrescriptionResponse {
        private Long id; private Long appointmentId; private Long doctorId; private Long patientId;
        private PrescriptionStatus status; private LocalDateTime createdAt;
        private List<PrescriptionItemResponse> items;
    }
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/service/PharmacyService.java", '''package com.medicore.pharmacy.service;

import com.medicore.common.exception.BadRequestException;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.pharmacy.dto.PharmacyDtos.*;
import com.medicore.pharmacy.entity.*;
import com.medicore.pharmacy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PharmacyService {
    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;

    public List<MedicineResponse> listMedicines() {
        return medicineRepository.findAll().stream().map(this::toMedicine).collect(Collectors.toList());
    }

    public List<MedicineResponse> lowStock() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQty() <= m.getReorderLevel())
                .map(this::toMedicine).collect(Collectors.toList());
    }

    @Transactional public MedicineResponse addMedicine(MedicineRequest req) {
        Medicine m = Medicine.builder().name(req.getName()).description(req.getDescription())
                .stockQty(req.getStockQty()).unitPrice(req.getUnitPrice())
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10).build();
        return toMedicine(medicineRepository.save(m));
    }

    public List<PrescriptionResponse> pendingPrescriptions() {
        return prescriptionRepository.findByStatusOrderByCreatedAtDesc(PrescriptionStatus.PENDING)
                .stream().map(this::toPrescription).collect(Collectors.toList());
    }

    public List<PrescriptionResponse> byPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toPrescription).collect(Collectors.toList());
    }

    @Transactional public PrescriptionResponse create(PrescriptionRequest req) {
        Prescription p = Prescription.builder().appointmentId(req.getAppointmentId())
                .doctorId(req.getDoctorId()).patientId(req.getPatientId())
                .status(PrescriptionStatus.PENDING).build();
        for (PrescriptionItemRequest item : req.getItems()) {
            PrescriptionItem pi = PrescriptionItem.builder().prescription(p)
                    .medicineId(item.getMedicineId()).dosage(item.getDosage())
                    .frequency(item.getFrequency()).durationDays(item.getDurationDays()).build();
            p.getItems().add(pi);
        }
        return toPrescription(prescriptionRepository.save(p));
    }

    @Transactional public PrescriptionResponse dispense(Long id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        if (p.getStatus() != PrescriptionStatus.PENDING) throw new BadRequestException("Already dispensed or cancelled");
        for (PrescriptionItem item : p.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found: " + item.getMedicineId()));
            if (med.getStockQty() < 1) throw new BadRequestException("Insufficient stock for " + med.getName());
            med.setStockQty(med.getStockQty() - 1);
            medicineRepository.save(med);
        }
        p.setStatus(PrescriptionStatus.DISPENSED);
        return toPrescription(prescriptionRepository.save(p));
    }

    private MedicineResponse toMedicine(Medicine m) {
        MedicineResponse r = new MedicineResponse();
        r.setId(m.getId()); r.setName(m.getName()); r.setDescription(m.getDescription());
        r.setStockQty(m.getStockQty()); r.setUnitPrice(m.getUnitPrice()); r.setReorderLevel(m.getReorderLevel());
        return r;
    }

    private PrescriptionResponse toPrescription(Prescription p) {
        PrescriptionResponse r = new PrescriptionResponse();
        r.setId(p.getId()); r.setAppointmentId(p.getAppointmentId()); r.setDoctorId(p.getDoctorId());
        r.setPatientId(p.getPatientId()); r.setStatus(p.getStatus()); r.setCreatedAt(p.getCreatedAt());
        r.setItems(p.getItems().stream().map(i -> {
            PrescriptionItemResponse ir = new PrescriptionItemResponse();
            ir.setId(i.getId()); ir.setMedicineId(i.getMedicineId()); ir.setDosage(i.getDosage());
            ir.setFrequency(i.getFrequency()); ir.setDurationDays(i.getDurationDays());
            return ir;
        }).collect(Collectors.toList()));
        return r;
    }
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/controller/PharmacyController.java", '''package com.medicore.pharmacy.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.pharmacy.dto.PharmacyDtos.*;
import com.medicore.pharmacy.service.PharmacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/pharmacy") @RequiredArgsConstructor
public class PharmacyController {
    private final PharmacyService pharmacyService;

    @GetMapping("/medicines") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ApiResponse<List<MedicineResponse>> medicines() { return ApiResponse.ok(pharmacyService.listMedicines()); }

    @GetMapping("/medicines/low-stock") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ApiResponse<List<MedicineResponse>> lowStock() { return ApiResponse.ok(pharmacyService.lowStock()); }

    @PostMapping("/medicines") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST')")
    public ApiResponse<MedicineResponse> addMedicine(@Valid @RequestBody MedicineRequest req) { return ApiResponse.ok(pharmacyService.addMedicine(req)); }

    @GetMapping("/prescriptions") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR')")
    public ApiResponse<List<PrescriptionResponse>> pending() { return ApiResponse.ok(pharmacyService.pendingPrescriptions()); }

    @GetMapping("/prescriptions/patient/{patientId}") @PreAuthorize("hasAnyRole('ADMIN','PHARMACIST','DOCTOR','PATIENT')")
    public ApiResponse<List<PrescriptionResponse>> byPatient(@PathVariable Long patientId) { return ApiResponse.ok(pharmacyService.byPatient(patientId)); }

    @PostMapping("/prescriptions") @PreAuthorize("hasRole('DOCTOR')")
    public ApiResponse<PrescriptionResponse> create(@Valid @RequestBody PrescriptionRequest req) { return ApiResponse.ok(pharmacyService.create(req)); }

    @PatchMapping("/prescriptions/{id}/dispense") @PreAuthorize("hasRole('PHARMACIST')")
    public ApiResponse<PrescriptionResponse> dispense(@PathVariable Long id) { return ApiResponse.ok(pharmacyService.dispense(id)); }
}''')

w(BACKEND / "pharmacy-service/src/main/java/com/medicore/pharmacy/config/PharmacyDataInitializer.java", '''package com.medicore.pharmacy.config;

import com.medicore.pharmacy.entity.Medicine;
import com.medicore.pharmacy.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component @RequiredArgsConstructor
public class PharmacyDataInitializer implements CommandLineRunner {
    private final MedicineRepository medicineRepository;
    @Override public void run(String... args) {
        if (medicineRepository.count() == 0) {
            medicineRepository.save(Medicine.builder().name("Paracetamol 500mg").description("Pain reliever").stockQty(200).unitPrice(new BigDecimal("5.00")).reorderLevel(20).build());
            medicineRepository.save(Medicine.builder().name("Amoxicillin 250mg").description("Antibiotic").stockQty(150).unitPrice(new BigDecimal("12.50")).reorderLevel(15).build());
            medicineRepository.save(Medicine.builder().name("Ibuprofen 400mg").description("Anti-inflammatory").stockQty(8).unitPrice(new BigDecimal("8.00")).reorderLevel(10).build());
        }
    }
}''')

# ============ NOTIFICATION SERVICE ============
scaffold("notification-service", "notification", 8087, "notification_db",
         extra='<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-websocket</artifactId></dependency>')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/entity/Notification.java", '''package com.medicore.notification.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="notifications") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(nullable=false,length=60) private String type;
    @Column(nullable=false,length=150) private String title;
    @Column(nullable=false,length=500) private String message;
    @Column(name="is_read",nullable=false) private Boolean isRead=false;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}''')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/repository/NotificationRepository.java", '''package com.medicore.notification.repository;
import com.medicore.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
}''')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/dto/NotificationDtos.java", '''package com.medicore.notification.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class NotificationDtos {
    @Data public static class CreateRequest {
        @NotNull private Long userId;
        @NotBlank private String type;
        @NotBlank private String title;
        @NotBlank private String message;
    }
    @Data public static class NotificationResponse {
        private Long id; private Long userId; private String type;
        private String title; private String message; private Boolean isRead; private LocalDateTime createdAt;
    }
}''')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/service/NotificationService.java", '''package com.medicore.notification.service;

import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.security.SecurityUtils;
import com.medicore.notification.dto.NotificationDtos.*;
import com.medicore.notification.entity.Notification;
import com.medicore.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<NotificationResponse> myNotifications() {
        Long userId = SecurityUtils.currentUserId();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long unreadCount() {
        return notificationRepository.countByUserIdAndIsReadFalse(SecurityUtils.currentUserId());
    }

    @Transactional public NotificationResponse create(CreateRequest req) {
        Notification n = Notification.builder().userId(req.getUserId()).type(req.getType())
                .title(req.getTitle()).message(req.getMessage()).isRead(false).build();
        Notification saved = notificationRepository.save(n);
        messagingTemplate.convertAndSend("/topic/user/" + req.getUserId(), toResponse(saved));
        return toResponse(saved);
    }

    @Transactional public NotificationResponse markRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setIsRead(true);
        return toResponse(notificationRepository.save(n));
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId()); r.setUserId(n.getUserId()); r.setType(n.getType());
        r.setTitle(n.getTitle()); r.setMessage(n.getMessage()); r.setIsRead(n.getIsRead()); r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}''')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/controller/NotificationController.java", '''package com.medicore.notification.controller;

import com.medicore.common.dto.ApiResponse;
import com.medicore.notification.dto.NotificationDtos.*;
import com.medicore.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<NotificationResponse>> list() { return ApiResponse.ok(notificationService.myNotifications()); }

    @GetMapping("/unread-count") @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Long>> unread() { return ApiResponse.ok(Map.of("count", notificationService.unreadCount())); }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST','DOCTOR')")
    public ApiResponse<NotificationResponse> create(@Valid @RequestBody CreateRequest req) { return ApiResponse.ok(notificationService.create(req)); }

    @PatchMapping("/{id}/read") @PreAuthorize("isAuthenticated()")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) { return ApiResponse.ok(notificationService.markRead(id)); }
}''')

w(BACKEND / "notification-service/src/main/java/com/medicore/notification/config/WebSocketConfig.java", '''package com.medicore.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}''')

print("Remaining services generated.")
