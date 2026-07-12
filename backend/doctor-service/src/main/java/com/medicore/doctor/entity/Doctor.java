package com.medicore.doctor.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="doctors") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Doctor {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id",nullable=false) private Long userId;
    @Column(name="first_name",nullable=false,length=80) private String firstName;
    @Column(name="last_name",nullable=false,length=80) private String lastName;
    @Column(nullable=false,length=120) private String specialization;
    @Column(nullable=false,length=120) private String department;
    @Builder.Default
    @Column(name="experience_years",nullable=false) private Integer experienceYears=0;
    @Builder.Default
    @Column(name="consultation_fee",nullable=false) private BigDecimal consultationFee=BigDecimal.ZERO;
    private String bio;
    @Builder.Default
    @Column(name="is_active",nullable=false) private Boolean isActive=true;
    @Column(name="created_at",insertable=false,updatable=false) private LocalDateTime createdAt;
}
