-- nurse_db
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
