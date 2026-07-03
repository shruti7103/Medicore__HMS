package com.medicore.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id") private Long userId;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "entity_type", nullable = false, length = 60) private String entityType;
    @Column(name = "entity_id") private Long entityId;
    @Column(length = 500) private String details;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;
}
