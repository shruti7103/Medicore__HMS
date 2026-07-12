package com.medicore.nurse.entity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDateTime;
@Entity @Table(name="patient_assignments") @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PatientAssignment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="nurse_id",nullable=false) private Long nurseId;
 @Column(name="patient_id",nullable=false) private Long patientId;
 @Column(name="assigned_by",nullable=false) private Long assignedBy;
 @Column(name="assigned_at",insertable=false,updatable=false) private LocalDateTime assignedAt;
 @Builder.Default
 @Enumerated(EnumType.STRING) @Column(nullable=false) private AssignmentStatus status=AssignmentStatus.ACTIVE;
 private String notes;
}
