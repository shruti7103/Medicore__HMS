package com.medicore.auth.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="refresh_tokens") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="token_hash",nullable=false) private String tokenHash;
    @Column(name="expires_at",nullable=false) private LocalDateTime expiresAt;
    @Column(nullable=false) private Boolean revoked=false;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
