package com.medicore.auth.entity;
import com.medicore.common.model.Role;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=120) private String name;
    @Column(nullable=false,unique=true,length=160) private String email;
    @Column(name="password_hash",nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role;
    @Builder.Default
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false) private LocalDateTime updatedAt;
}
