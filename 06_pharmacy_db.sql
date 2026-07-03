-- ================================================
-- pharmacy_db  —  Pharmacy Service
-- ================================================
CREATE DATABASE IF NOT EXISTS pharmacy_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pharmacy_db;

CREATE TABLE medicines (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  description     VARCHAR(255)  NULL,
  stock_qty       INT           NOT NULL DEFAULT 0,
  unit_price      DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
  reorder_level   INT           NOT NULL DEFAULT 10,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE prescriptions (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  BIGINT        NOT NULL,   -- references appointment_db.appointments.id
  doctor_id       BIGINT        NOT NULL,   -- references doctor_db.doctors.id
  patient_id      BIGINT        NOT NULL,   -- references patient_db.patients.id
  status          ENUM('PENDING','DISPENSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE prescription_items (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  prescription_id   BIGINT        NOT NULL,
  medicine_id       BIGINT        NOT NULL,
  dosage            VARCHAR(80)   NOT NULL,   -- e.g. "500mg"
  frequency         VARCHAR(80)   NOT NULL,   -- e.g. "twice daily"
  duration_days     INT           NOT NULL,
  CONSTRAINT fk_pi_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pi_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id)
) ENGINE=InnoDB;

CREATE INDEX idx_presc_patient ON prescriptions(patient_id);
CREATE INDEX idx_presc_status ON prescriptions(status);
CREATE INDEX idx_pi_prescription ON prescription_items(prescription_id);
