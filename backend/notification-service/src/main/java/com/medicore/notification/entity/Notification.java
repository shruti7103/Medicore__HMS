package com.medicore.notification.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="notifications") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(nullable=false,length=60) private String type;
    @Column(nullable=false,length=150) private String title;
    @Column(nullable=false,length=500) private String message;
    @Builder.Default
    @Column(name="is_read",nullable=false) private Boolean isRead=false;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
