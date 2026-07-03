#!/usr/bin/env python3
"""Generate nurse, analytics, symptom-check services + auth extensions."""
from pathlib import Path
ROOT = Path(r"d:\Shruti HMS")
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend" / "src"

def w(p, c):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(c.strip()+"\n", encoding="utf-8"); print("+", p.relative_to(ROOT))

POM = '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
<modelVersion>4.0.0</modelVersion>
<parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
<artifactId>{a}</artifactId>
<dependencies>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
{extra}
<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
<dependency><groupId>com.medicore</groupId><artifactId>common</artifactId></dependency>
<dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
</dependencies>
<build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>'''

JPA_DEPS = '''<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
<dependency><groupId>com.mysql</groupId><artifactId>mysql-connector-j</artifactId><scope>runtime</scope></dependency>'''

SEC = '''package com.medicore.{pkg}.config;
import com.medicore.common.security.HeaderAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {{
 @Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {{
  http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a->a.requestMatchers("/actuator/**","/internal/**").permitAll().anyRequest().authenticated())
   .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
  return http.build();
 }} }}'''

APP = '''package com.medicore.{pkg};
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
@SpringBootApplication @Import(CommonAutoConfiguration.class)
public class {cls} {{ public static void main(String[] a) {{ SpringApplication.run({cls}.class,a); }} }}'''

YML = '''server:
 port: {port}
spring:
 application:
  name: {name}
 datasource:
  url: jdbc:mysql://localhost:3306/{db}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  username: root
  password: ${{DB_PASSWORD:root}}
  driver-class-name: com.mysql.cj.jdbc.Driver
 jpa:
  hibernate:
   ddl-auto: validate
  properties:
   hibernate:
    dialect: org.hibernate.dialect.MySQL8Dialect
eureka:
 client:
  service-url:
   defaultZone: http://localhost:8761/eureka/
jwt:
 secret: medicore-super-secret-key-change-in-production-min-256-bits!!
'''

# ===== NURSE SERVICE =====
w(BACKEND/"nurse-service/pom.xml", POM.format(a="nurse-service", extra=JPA_DEPS))
w(BACKEND/"nurse-service/src/main/resources/application.yml", YML.format(port=8088,name="nurse-service",db="nurse_db"))
w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/NurseServiceApplication.java", APP.format(pkg="nurse",cls="NurseServiceApplication"))
w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/config/SecurityConfig.java", SEC.format(pkg="nurse"))

for name, body in [
("entity/AssignmentStatus.java","package com.medicore.nurse.entity; public enum AssignmentStatus { ACTIVE, COMPLETED, CANCELLED }"),
("entity/TaskStatus.java","package com.medicore.nurse.entity; public enum TaskStatus { TODO, IN_PROGRESS, DONE }"),
("entity/Nurse.java",'''package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="nurses") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Nurse {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="first_name",nullable=false) private String firstName;
 @Column(name="last_name",nullable=false) private String lastName;
 @Column(nullable=false) private String department;
 @Column(name="shift_pattern") private String shiftPattern;
 @Column(name="is_active",nullable=false) private Boolean isActive=true;
 @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}'''),
("entity/PatientAssignment.java",'''package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="patient_assignments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientAssignment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="nurse_id",nullable=false) private Long nurseId;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="assigned_by",nullable=false) private Long assignedBy;
 @Column(name="assigned_at",insertable=false,updatable=false) private LocalDateTime assignedAt;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private AssignmentStatus status=AssignmentStatus.ACTIVE;
 private String notes;
}'''),
("entity/NursingTask.java",'''package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="nursing_tasks") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NursingTask {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="assigned_nurse_id",nullable=false) private Long assignedNurseId;
 @Column(name="created_by",nullable=false) private Long createdBy;
 @Column(nullable=false) private String title;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private TaskStatus status=TaskStatus.TODO;
 @Column(name="due_at") private LocalDateTime dueAt;
 @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}'''),
("entity/MedicationAdministration.java",'''package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="medication_administration") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicationAdministration {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="prescription_item_id",nullable=false) private Long prescriptionItemId;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="administered_by_nurse_id",nullable=false) private Long administeredByNurseId;
 @Column(name="administered_at",insertable=false,updatable=false) private LocalDateTime administeredAt;
 private String notes;
}'''),
]:
 w(BACKEND/f"nurse-service/src/main/java/com/medicore/nurse/{name}", body)

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/repository/NurseRepository.java", '''package com.medicore.nurse.repository;
import com.medicore.nurse.entity.Nurse; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; public interface NurseRepository extends JpaRepository<Nurse,Long> {
 Optional<Nurse> findByUserId(Long userId); }''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/repository/PatientAssignmentRepository.java", '''package com.medicore.nurse.repository;
import com.medicore.nurse.entity.*; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; public interface PatientAssignmentRepository extends JpaRepository<PatientAssignment,Long> {
 List<PatientAssignment> findByNurseIdAndStatus(Long nurseId, AssignmentStatus status); }''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/repository/NursingTaskRepository.java", '''package com.medicore.nurse.repository;
import com.medicore.nurse.entity.*; import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; public interface NursingTaskRepository extends JpaRepository<NursingTask,Long> {
 List<NursingTask> findByAssignedNurseIdOrderByDueAtAsc(Long nurseId); }''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/repository/MedicationAdministrationRepository.java", '''package com.medicore.nurse.repository;
import com.medicore.nurse.entity.MedicationAdministration; import org.springframework.data.jpa.repository.JpaRepository;
public interface MedicationAdministrationRepository extends JpaRepository<MedicationAdministration,Long> {}''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/dto/NurseDtos.java", '''package com.medicore.nurse.dto;
import com.medicore.nurse.entity.*; import jakarta.validation.constraints.*; import lombok.Data;
import java.time.LocalDateTime; import java.util.List;
public class NurseDtos {
 @Data public static class VitalsRequest { @NotNull private Long patientId; private Integer bpSystolic; private Integer bpDiastolic; private Integer pulse; private java.math.BigDecimal temperatureC; private java.math.BigDecimal weightKg; }
 @Data public static class MedLogRequest { @NotNull private Long prescriptionItemId; @NotNull private Long patientId; private String notes; }
 @Data public static class EscalateRequest { @NotNull private Long patientId; @NotNull private Long doctorId; @NotBlank private String message; }
 @Data public static class TaskResponse { private Long id; private Long patientId; private String title; private TaskStatus status; private LocalDateTime dueAt; }
 @Data public static class AssignmentResponse { private Long id; private Long patientId; private AssignmentStatus status; private String notes; }
}''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/client/PatientClient.java", '''package com.medicore.nurse.client;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
@Configuration
public class PatientClientConfig {
 @Bean @LoadBalanced RestTemplate restTemplate() { return new RestTemplate(); }
}''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/service/NurseService.java", '''package com.medicore.nurse.service;
import com.medicore.common.exception.ResourceNotFoundException;
import com.medicore.common.security.SecurityUtils;
import com.medicore.nurse.dto.NurseDtos.*;
import com.medicore.nurse.entity.*;
import com.medicore.nurse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.util.List; import java.util.Map; import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class NurseService {
 private final NurseRepository nurseRepository;
 private final PatientAssignmentRepository assignmentRepository;
 private final NursingTaskRepository taskRepository;
 private final MedicationAdministrationRepository medLogRepository;
 private final RestTemplate restTemplate;
 private Nurse me() { return nurseRepository.findByUserId(SecurityUtils.currentUserId()).orElseThrow(()->new ResourceNotFoundException("Nurse profile not found")); }
 public List<AssignmentResponse> assignments() { Long nid=me().getId(); return assignmentRepository.findByNurseIdAndStatus(nid,AssignmentStatus.ACTIVE).stream().map(this::toAssign).collect(Collectors.toList()); }
 public List<TaskResponse> tasks() { return taskRepository.findByAssignedNurseIdOrderByDueAtAsc(me().getId()).stream().map(this::toTask).collect(Collectors.toList()); }
 @Transactional public TaskResponse completeTask(Long id) { NursingTask t=taskRepository.findById(id).orElseThrow(); t.setStatus(TaskStatus.DONE); return toTask(taskRepository.save(t)); }
 @Transactional public void logVitals(VitalsRequest req) {
  restTemplate.postForEntity("http://patient-service/patients/"+req.getPatientId()+"/vitals", Map.of(
   "bpSystolic",req.getBpSystolic(),"bpDiastolic",req.getBpDiastolic(),"pulse",req.getPulse(),
   "temperatureC",req.getTemperatureC(),"weightKg",req.getWeightKg()), Object.class); }
 @Transactional public void logMedication(MedLogRequest req) {
  medLogRepository.save(MedicationAdministration.builder().prescriptionItemId(req.getPrescriptionItemId())
   .patientId(req.getPatientId()).administeredByNurseId(me().getId()).notes(req.getNotes()).build()); }
 @Transactional public void escalate(EscalateRequest req) {
  restTemplate.postForEntity("http://notification-service/notifications", Map.of(
   "userId",req.getDoctorId(),"type","ESCALATION","title","Patient escalation","message",req.getMessage()), Object.class); }
 private AssignmentResponse toAssign(PatientAssignment a){ AssignmentResponse r=new AssignmentResponse(); r.setId(a.getId()); r.setPatientId(a.getPatientId()); r.setStatus(a.getStatus()); r.setNotes(a.getNotes()); return r; }
 private TaskResponse toTask(NursingTask t){ TaskResponse r=new TaskResponse(); r.setId(t.getId()); r.setPatientId(t.getPatientId()); r.setTitle(t.getTitle()); r.setStatus(t.getStatus()); r.setDueAt(t.getDueAt()); return r; }
}''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/controller/NurseController.java", '''package com.medicore.nurse.controller;
import com.medicore.common.dto.ApiResponse; import com.medicore.nurse.dto.NurseDtos.*; import com.medicore.nurse.service.NurseService;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/nurse") @RequiredArgsConstructor
public class NurseController {
 private final NurseService nurseService;
 @GetMapping("/assignments") @PreAuthorize("hasRole('NURSE')") public ApiResponse<List<AssignmentResponse>> assignments(){ return ApiResponse.ok(nurseService.assignments()); }
 @GetMapping("/tasks") @PreAuthorize("hasRole('NURSE')") public ApiResponse<List<TaskResponse>> tasks(){ return ApiResponse.ok(nurseService.tasks()); }
 @PatchMapping("/tasks/{id}/complete") @PreAuthorize("hasRole('NURSE')") public ApiResponse<TaskResponse> complete(@PathVariable Long id){ return ApiResponse.ok(nurseService.completeTask(id)); }
 @PostMapping("/vitals") @PreAuthorize("hasRole('NURSE')") public ApiResponse<Void> vitals(@Valid @RequestBody VitalsRequest req){ nurseService.logVitals(req); return ApiResponse.ok("Vitals recorded",null); }
 @PostMapping("/medication-log") @PreAuthorize("hasRole('NURSE')") public ApiResponse<Void> medLog(@Valid @RequestBody MedLogRequest req){ nurseService.logMedication(req); return ApiResponse.ok("Logged",null); }
 @PostMapping("/escalate") @PreAuthorize("hasRole('NURSE')") public ApiResponse<Void> escalate(@Valid @RequestBody EscalateRequest req){ nurseService.escalate(req); return ApiResponse.ok("Escalated",null); }
}''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/config/NurseDataInitializer.java", '''package com.medicore.nurse.config;
import com.medicore.nurse.entity.*; import com.medicore.nurse.repository.*;
import lombok.RequiredArgsConstructor; import org.springframework.boot.CommandLineRunner; import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor
public class NurseDataInitializer implements CommandLineRunner {
 private final NurseRepository nurseRepository; private final NursingTaskRepository taskRepository;
 @Override public void run(String... args) {
  if(nurseRepository.count()>0) return;
  Nurse n=nurseRepository.save(Nurse.builder().userId(6L).firstName("Priya").lastName("Sharma").department("General").shiftPattern("Day").isActive(true).build());
  taskRepository.save(NursingTask.builder().patientId(1L).assignedNurseId(n.getId()).createdBy(2L).title("Check vitals - Room 4B").status(TaskStatus.TODO).build());
 }}''')

print("Nurse service done")
