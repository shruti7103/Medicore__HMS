package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="nurses") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Nurse {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(name="first_name",nullable=false) private String firstName;
 @Column(name="last_name",nullable=false) private String lastName;
 @Column(nullable=false) private String department;
 @Column(name="shift_pattern") private String shiftPattern;
 @Column(name="is_active",nullable=false) private Boolean isActive=true;
 @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
