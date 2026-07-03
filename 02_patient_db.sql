-- ================================================
-- patient_db  —  Patient Service
-- ================================================
CREATE DATABASE IF NOT EXISTS patient_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patient_db;

CREATE TABLE patients (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT        NOT NULL,          -- references auth_db.users.id (no cross-DB FK)
  first_name        VARCHAR(80)   NOT NULL,
  last_name         VARCHAR(80)   NOT NULL,
  dob               DATE          NULL,
  gender            ENUM('MALE','FEMALE','OTHER') NULL,
  blood_group       VARCHAR(5)    NULL,
  phone             VARCHAR(20)   NULL,
  address           VARCHAR(255)  NULL,
  emergency_contact VARCHAR(120)  NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE medical_history (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT        NOT NULL,
  doctor_id     BIGINT        NULL,          -- references doctor_db.doctors.id
  visit_date    DATE          NOT NULL,
  diagnosis     VARCHAR(255)  NULL,
  notes         TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mh_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE vitals (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT        NOT NULL,
  recorded_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bp_systolic   INT           NULL,
  bp_diastolic  INT           NULL,
  pulse         INT           NULL,
  temperature_c DECIMAL(4,1)  NULL,
  weight_kg     DECIMAL(5,2)  NULL,
  CONSTRAINT fk_v_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE allergies (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT        NOT NULL,
  allergen      VARCHAR(120)  NOT NULL,
  severity      ENUM('MILD','MODERATE','SEVERE') NOT NULL DEFAULT 'MILD',
  notes         VARCHAR(255)  NULL,
  CONSTRAINT fk_a_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_mh_patient ON medical_history(patient_id);
CREATE INDEX idx_v_patient ON vitals(patient_id);
