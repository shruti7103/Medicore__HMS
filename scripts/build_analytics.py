#!/usr/bin/env python3
"""Generate analytics + symptom-check Java services."""
from pathlib import Path
ROOT = Path(r"d:\Shruti HMS")
BACKEND = ROOT / "backend"

def w(p, c):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(c.strip()+"\n", encoding="utf-8"); print("+", p.relative_to(ROOT))

POM_WEB = '''<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
<modelVersion>4.0.0</modelVersion>
<parent><groupId>com.medicore</groupId><artifactId>medicore-parent</artifactId><version>1.0.0</version></parent>
<artifactId>{a}</artifactId>
<dependencies>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
<dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-loadbalancer</artifactId></dependency>
<dependency><groupId>com.medicore</groupId><artifactId>common</artifactId></dependency>
<dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
</dependencies>
<build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>'''

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
   .authorizeHttpRequests(a->a.requestMatchers("/symptom-check").permitAll().anyRequest().authenticated())
   .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
  return http.build();
 }} }}'''

APP = '''package com.medicore.{pkg};
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.client.RestTemplate;
@SpringBootApplication @Import(CommonAutoConfiguration.class)
public class {cls} {{
 public static void main(String[] a) {{ SpringApplication.run({cls}.class,a); }}
 @Bean @LoadBalanced RestTemplate restTemplate() {{ return new RestTemplate(); }}
}}'''

# Analytics service
w(BACKEND/"analytics-service/pom.xml", POM_WEB.format(a="analytics-service"))
w(BACKEND/"analytics-service/src/main/resources/application.yml", '''server:
 port: 8089
spring:
 application:
  name: analytics-service
eureka:
 client:
  service-url:
   defaultZone: http://localhost:8761/eureka/
jwt:
 secret: medicore-super-secret-key-change-in-production-min-256-bits!!
''')
w(BACKEND/"analytics-service/src/main/java/com/medicore/analytics/AnalyticsServiceApplication.java", APP.format(pkg="analytics",cls="AnalyticsServiceApplication"))
w(BACKEND/"analytics-service/src/main/java/com/medicore/analytics/config/SecurityConfig.java", '''package com.medicore.analytics.config;
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
public class SecurityConfig {
 @Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {
  http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a->a.requestMatchers("/internal/**").permitAll().anyRequest().authenticated())
   .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
  return http.build();
 }}''')

w(BACKEND/"analytics-service/src/main/java/com/medicore/analytics/dto/AnalyticsDtos.java", '''package com.medicore.analytics.dto;
import lombok.Data; import java.math.BigDecimal; import java.util.List;
public class AnalyticsDtos {
 @Data public static class Summary {
  private long totalPatients; private long totalDoctors; private long totalNurses;
  private long totalAppointments; private long todayAppointments; private long totalInvoices;
  private BigDecimal revenueThisMonth;
  private List<DeptSplit> departmentSplit; private List<RevenuePoint> revenueTrend;
 }
 @Data public static class DeptSplit { private String department; private long count; }
 @Data public static class RevenuePoint { private String month; private BigDecimal revenue; }
}''')

w(BACKEND/"analytics-service/src/main/java/com/medicore/analytics/service/AnalyticsService.java", '''package com.medicore.analytics.service;
import com.medicore.analytics.dto.AnalyticsDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal; import java.util.*;
@Service @RequiredArgsConstructor
public class AnalyticsService {
 private final RestTemplate restTemplate;
 private long count(String url) {
  try { Map<?,?> r=restTemplate.getForObject(url, Map.class); if(r!=null && r.get("data") instanceof Map<?,?> d) return ((Number)d.get("count")).longValue(); } catch(Exception ignored) {}
  return 0;
 }
 public Summary summary() {
  Summary s=new Summary();
  s.setTotalPatients(count("http://patient-service/internal/stats"));
  s.setTotalDoctors(count("http://doctor-service/internal/stats"));
  s.setTotalNurses(count("http://nurse-service/internal/stats"));
  s.setTotalAppointments(count("http://appointment-service/internal/stats"));
  s.setTotalInvoices(count("http://billing-service/internal/stats"));
  s.setTodayAppointments(count("http://appointment-service/internal/stats/today"));
  s.setRevenueThisMonth(BigDecimal.valueOf(count("http://billing-service/internal/stats/revenue")));
  s.setDepartmentSplit(List.of(new DeptSplit(){{setDepartment("General");setCount(s.getTotalDoctors());}}));
  s.setRevenueTrend(List.of(new RevenuePoint(){{setMonth("Jan");setRevenue(s.getRevenueThisMonth());}}));
  return s;
 }
}''')

w(BACKEND/"analytics-service/src/main/java/com/medicore/analytics/controller/AnalyticsController.java", '''package com.medicore.analytics.controller;
import com.medicore.analytics.dto.AnalyticsDtos.Summary;
import com.medicore.analytics.service.AnalyticsService;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/analytics") @RequiredArgsConstructor
public class AnalyticsController {
 private final AnalyticsService analyticsService;
 @GetMapping("/summary") @PreAuthorize("hasRole('ADMIN')") public ApiResponse<Summary> summary(){ return ApiResponse.ok(analyticsService.summary()); }
}''')

# Symptom check service
w(BACKEND/"symptom-check-service/pom.xml", POM_WEB.format(a="symptom-check-service"))
w(BACKEND/"symptom-check-service/src/main/resources/application.yml", '''server:
 port: 8090
spring:
 application:
  name: symptom-check-service
eureka:
 client:
  service-url:
   defaultZone: http://localhost:8761/eureka/
''')
w(BACKEND/"symptom-check-service/src/main/java/com/medicore/symptom/SymptomCheckServiceApplication.java", '''package com.medicore.symptom;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SymptomCheckServiceApplication {
 public static void main(String[] a) { SpringApplication.run(SymptomCheckServiceApplication.class,a); }
}''')

w(BACKEND/"symptom-check-service/src/main/java/com/medicore/symptom/config/SecurityConfig.java", '''package com.medicore.symptom.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
@Configuration @EnableWebSecurity
public class SecurityConfig {
 @Bean SecurityFilterChain chain(HttpSecurity http) throws Exception {
  http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a->a.anyRequest().permitAll());
  return http.build();
 }}''')

w(BACKEND/"symptom-check-service/src/main/java/com/medicore/symptom/controller/SymptomController.java", '''package com.medicore.symptom.controller;
import com.medicore.common.dto.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class SymptomController {
 private static final Map<String,String> RULES=Map.of(
  "chest","Cardiology","heart","Cardiology","cardiac","Cardiology",
  "child","Pediatrics","pediatric","Pediatrics","baby","Pediatrics",
  "bone","Orthopedics","joint","Orthopedics","fracture","Orthopedics",
  "headache","Neurology","seizure","Neurology","brain","Neurology",
  "fever","General Medicine","cough","General Medicine","cold","General Medicine");
 @PostMapping("/symptom-check")
 public ApiResponse<Result> check(@RequestBody Request req) {
  String text=req.getSymptoms().toLowerCase(); String dept="General Medicine"; int hits=0;
  for(var e:RULES.entrySet()) if(text.contains(e.getKey())) { dept=e.getValue(); hits++; }
  Result r=new Result(); r.setDepartment(dept); r.setConfidence(Math.min(0.95,0.5+hits*0.15)); r.setKeywords(List.of(dept)); return ApiResponse.ok(r);
 }
 @Data public static class Request { @NotBlank private String symptoms; }
 @Data public static class Result { private String department; private double confidence; private List<String> keywords; }
}''')

# Internal stats controllers - add to existing services
INTERNAL = '''package com.medicore.{pkg}.controller;
import com.medicore.common.dto.ApiResponse;
import {repo_import}
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {{
 private final {repo} repository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats() {{ return ApiResponse.ok(Map.of("count", repository.count())); }}
{extra}
}}'''

w(BACKEND/"patient-service/src/main/java/com/medicore/patient/controller/InternalStatsController.java",
 INTERNAL.format(pkg="patient", repo_import="com.medicore.patient.repository.PatientRepository", repo="PatientRepository", extra=""))

w(BACKEND/"doctor-service/src/main/java/com/medicore/doctor/controller/InternalStatsController.java",
 INTERNAL.format(pkg="doctor", repo_import="com.medicore.doctor.repository.DoctorRepository", repo="DoctorRepository", extra=""))

w(BACKEND/"appointment-service/src/main/java/com/medicore/appointment/controller/InternalStatsController.java", '''package com.medicore.appointment.controller;
import com.medicore.appointment.repository.AppointmentRepository;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate; import java.time.LocalDateTime; import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final AppointmentRepository repository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats(){ return ApiResponse.ok(Map.of("count",repository.count())); }
 @GetMapping("/stats/today") public ApiResponse<Map<String,Long>> today(){
  LocalDateTime s=LocalDate.now().atStartOfDay(), e=s.plusDays(1);
  return ApiResponse.ok(Map.of("count",repository.findAll().stream().filter(a->a.getSlotStart().isAfter(s)&&a.getSlotStart().isBefore(e)).count()));
 }}''')

w(BACKEND/"billing-service/src/main/java/com/medicore/billing/controller/InternalStatsController.java", '''package com.medicore.billing.controller;
import com.medicore.billing.repository.InvoiceRepository; import com.medicore.billing.repository.PaymentRepository;
import com.medicore.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.Map;
@RestController @RequestMapping("/internal") @RequiredArgsConstructor
public class InternalStatsController {
 private final InvoiceRepository invoiceRepository; private final PaymentRepository paymentRepository;
 @GetMapping("/stats") public ApiResponse<Map<String,Long>> stats(){ return ApiResponse.ok(Map.of("count",invoiceRepository.count())); }
 @GetMapping("/stats/revenue") public ApiResponse<Map<String,Long>> revenue(){
  BigDecimal sum=paymentRepository.findAll().stream().map(p->p.getAmount()).reduce(BigDecimal.ZERO,BigDecimal::add);
  return ApiResponse.ok(Map.of("count",sum.longValue())); }}
''')

w(BACKEND/"nurse-service/src/main/java/com/medicore/nurse/controller/InternalStatsController.java",
 INTERNAL.format(pkg="nurse", repo_import="com.medicore.nurse.repository.NurseRepository", repo="NurseRepository", extra=""))

print("Analytics + Symptom done")
