-- ================================================
-- notification_db  —  Notification Service
-- ================================================
CREATE DATABASE IF NOT EXISTS notification_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE notification_db;

CREATE TABLE notifications (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT        NOT NULL,   -- references auth_db.users.id
  type          VARCHAR(60)   NOT NULL,   -- e.g. APPOINTMENT_CONFIRMED, BILL_GENERATED
  title         VARCHAR(150)  NOT NULL,
  message       VARCHAR(500)  NOT NULL,
  is_read       BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_notif_user ON notifications(user_id, is_read);

CREATE TABLE messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT NOT NULL,
  sender_name VARCHAR(120) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
