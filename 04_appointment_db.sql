-- ================================================
-- appointment_db  —  Appointment Service
-- ================================================
CREATE DATABASE IF NOT EXISTS appointment_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE appointment_db;

CREATE TABLE appointments (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id    BIGINT        NOT NULL,   -- references patient_db.patients.id
  doctor_id     BIGINT        NOT NULL,   -- references doctor_db.doctors.id
  slot_start    DATETIME      NOT NULL,
  slot_end      DATETIME      NOT NULL,
  status        ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')
                              NOT NULL DEFAULT 'PENDING',
  reason        VARCHAR(255)  NULL,
  telemedicine_link VARCHAR(255) NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  -- prevents the same doctor being double-booked for the exact same slot
  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, slot_start)
) ENGINE=InnoDB;

CREATE TABLE slot_holds (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  doctor_id           BIGINT     NOT NULL,
  slot_start          DATETIME   NOT NULL,
  slot_end            DATETIME   NOT NULL,
  held_by_patient_id  BIGINT     NOT NULL,
  expires_at          TIMESTAMP  NOT NULL,
  CONSTRAINT uq_hold_doctor_slot UNIQUE (doctor_id, slot_start)
) ENGINE=InnoDB;

CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_doctor_date ON appointments(doctor_id, slot_start);
CREATE INDEX idx_appt_status ON appointments(status);
