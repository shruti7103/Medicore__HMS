-- ================================================
-- doctor_db  —  Doctor Service
-- ================================================
CREATE DATABASE IF NOT EXISTS doctor_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doctor_db;

CREATE TABLE doctors (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT        NOT NULL,   -- references auth_db.users.id
  first_name          VARCHAR(80)   NOT NULL,
  last_name           VARCHAR(80)   NOT NULL,
  specialization      VARCHAR(120)  NOT NULL,
  department          VARCHAR(120)  NOT NULL,
  experience_years    INT           NOT NULL DEFAULT 0,
  consultation_fee    DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
  bio                 TEXT          NULL,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE availability_slots (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  doctor_id           BIGINT        NOT NULL,
  day_of_week         ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
  start_time          TIME          NOT NULL,
  end_time            TIME          NOT NULL,
  slot_duration_mins  INT           NOT NULL DEFAULT 30,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_as_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doctors_dept ON doctors(department);
CREATE INDEX idx_as_doctor ON availability_slots(doctor_id);
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
