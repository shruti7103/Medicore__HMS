#!/usr/bin/env python3
"""Master build generator - Java only, 6 roles, nurse/analytics/symptom services."""
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

def yml(name, port, db):
    return f'''server:
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
    show-sql: false
    properties:
      hibernate:
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

def sec(pkg):
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
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {{
    @Bean SecurityFilterChain filterChain(HttpSecurity http) throws Exception {{
        http.csrf(c->c.disable()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a.requestMatchers("/actuator/**","/internal/**").permitAll().anyRequest().authenticated())
            .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }}
}}'''

def app(pkg, cls):
    return f'''package com.medicore.{pkg};
import com.medicore.common.config.CommonAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
@SpringBootApplication @Import(CommonAutoConfiguration.class)
public class {cls} {{ public static void main(String[] args) {{ SpringApplication.run({cls}.class, args); }} }}'''

def scaffold(artifact, pkg, port, db, cls, extra=""):
    base = BACKEND / artifact
    w(base / "pom.xml", SERVICE_POM.format(artifact=artifact, extra=extra))
    w(base / f"src/main/java/com/medicore/{pkg}/{cls}.java", app(pkg, cls))
    w(base / f"src/main/java/com/medicore/{pkg}/config/SecurityConfig.java", sec(pkg))
    w(base / "src/main/resources/application.yml", yml(artifact, port, db))

# ============ SQL ============
w(ROOT / "01_auth_db.sql", '''-- auth_db
CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auth_db;
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','DOCTOR','NURSE','RECEPTIONIST','PATIENT','PHARMACIST') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE refresh_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id BIGINT NULL,
  details VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
''')

w(ROOT / "08_nurse_db.sql", '''-- nurse_db
CREATE DATABASE IF NOT EXISTS nurse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nurse_db;
CREATE TABLE nurses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  department VARCHAR(120) NOT NULL,
  shift_pattern VARCHAR(80) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE patient_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nurse_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_pa_nurse FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE nursing_tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  assigned_nurse_id BIGINT NOT NULL,
  created_by BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  status ENUM('TODO','IN_PROGRESS','DONE') NOT NULL DEFAULT 'TODO',
  due_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nt_nurse FOREIGN KEY (assigned_nurse_id) REFERENCES nurses(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE medication_administration (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  prescription_item_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL,
  administered_by_nurse_id BIGINT NOT NULL,
  administered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  CONSTRAINT fk_ma_nurse FOREIGN KEY (administered_by_nurse_id) REFERENCES nurses(id)
) ENGINE=InnoDB;
CREATE INDEX idx_pa_nurse ON patient_assignments(nurse_id, status);
CREATE INDEX idx_nt_nurse ON nursing_tasks(assigned_nurse_id, status);
''')

w(ROOT / "09_department_db.sql", '''-- department_db (doctor-service also uses departments table in doctor_db - add to 03)
''')

# Add departments to doctor db - update 03
doctor_sql = (ROOT / "03_doctor_db.sql").read_text(encoding="utf-8")
if "departments" not in doctor_sql:
    w(ROOT / "03_doctor_db.sql", doctor_sql.rstrip() + '''
CREATE TABLE departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;
INSERT INTO departments (name, description) VALUES
('General Medicine','General outpatient care'),
('Cardiology','Heart and cardiovascular'),
('Pediatrics','Child healthcare'),
('Orthopedics','Bone and joint care'),
('Neurology','Brain and nervous system');
''')

w(ROOT / "00_run_all.sql", '''SOURCE 01_auth_db.sql;
SOURCE 02_patient_db.sql;
SOURCE 03_doctor_db.sql;
SOURCE 04_appointment_db.sql;
SOURCE 05_billing_db.sql;
SOURCE 06_pharmacy_db.sql;
SOURCE 07_notification_db.sql;
SOURCE 08_nurse_db.sql;
''')

# Role enum
w(BACKEND / "common/src/main/java/com/medicore/common/model/Role.java", '''package com.medicore.common.model;
public enum Role { ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT, PHARMACIST }''')

print("SQL and Role updated. Run nurse/analytics/symptom service generation next...")
