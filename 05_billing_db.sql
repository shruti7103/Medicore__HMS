-- ================================================
-- billing_db  —  Billing Service
-- ================================================
CREATE DATABASE IF NOT EXISTS billing_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE billing_db;

CREATE TABLE invoices (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  BIGINT        NOT NULL,   -- references appointment_db.appointments.id
  patient_id      BIGINT        NOT NULL,   -- references patient_db.patients.id
  amount          DECIMAL(10,2) NOT NULL,
  status          ENUM('UNPAID','PAID','CANCELLED') NOT NULL DEFAULT 'UNPAID',
  issued_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date        DATE          NULL
) ENGINE=InnoDB;

CREATE TABLE payments (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id        BIGINT        NOT NULL,
  method            ENUM('CASH','CARD','UPI','INSURANCE') NOT NULL,
  transaction_ref   VARCHAR(120)  NULL,
  amount            DECIMAL(10,2) NOT NULL,
  paid_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_inv_patient ON invoices(patient_id);
CREATE INDEX idx_inv_appt ON invoices(appointment_id);
CREATE INDEX idx_pay_invoice ON payments(invoice_id);
